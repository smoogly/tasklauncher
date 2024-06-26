import {
    spawn,
    ChildProcessWithoutNullStreams,
    SpawnOptionsWithoutStdio,
} from "child_process";
import * as Observable from "zen-observable";

import { Fn } from "../work_api";
import { observableFromStream } from "../util/observable";
import { Execution } from "../execution";
import { merge } from "zen-observable/extras";
import { noop } from "../util/noop";
import { resolveStart } from "./start_detector";
import { platform } from "os";


export type StartDetector = (output: Observable<Buffer>) => Promise<void>;
export type CmdOptions = { supportsColor?: boolean };

export type CMDSpawnType = (command: string, args: ReadonlyArray<string>, options: SpawnOptionsWithoutStdio) => Pick<ChildProcessWithoutNullStreams, "stdout" | "stderr" | "on" | "kill">;
export function setupCmd(spwn: CMDSpawnType, buildEnv: (opts: CmdOptions) => Record<string, string | undefined>) {
    return function cmd(
        command: string,
        detectStart?: StartDetector,
    ): Fn<CmdOptions, Execution> & { taskName: string } {
        const trimmedCommand = command.replace(/\s+/g, " ").trim();
        const [executable, ...args] = trimmedCommand.split(" ");
        if (!executable) { throw new Error("No executable given"); }

        return Object.assign((input: CmdOptions): Execution => {
            let killed = false;
            let killRequested = false;
            let forceKillTimeout: NodeJS.Timeout;

            const child = spwn(executable, args, { env: buildEnv(input), shell: platform() === "win32" });
            const kill = () => {
                if (killed) { return; }
                killed = true;

                forceKillTimeout = setTimeout(() => {
                    child.kill("SIGINT");
                    child.kill("SIGTERM");
                    child.kill("SIGKILL");
                    child.stderr.destroy();
                    child.stdout.destroy();
                }, 5000);

                child.kill();
            };
            const onExit = () => clearTimeout(forceKillTimeout);

            const output = merge(observableFromStream(child.stdout), observableFromStream(child.stderr));
            const completed = new Promise<void>((res, rej) => {
                child.on("error", err => {
                    onExit();
                    rej(err);
                });
                child.on("exit", (code, signal) => {
                    onExit();
                    if (code === 0 || killed) { return res(); }
                    const reason = code !== null ? `non-zero code '${ code }'` : `signal '${ signal }'`;
                    rej(new Error(`Terminated with ${ reason }: ${ trimmedCommand }`));
                });
            });

            const startDetected = !detectStart ? completed : resolveStart(detectStart, output).catch(e => {
                kill();
                throw e;
            });

            const started = Promise.race([
                startDetected.then(() => "started"),
                completed.then(() => "completed"),
            ]).then(condition => {
                if (condition === "started") { return; }
                throw new Error("Task completed before start was detected. Please check your start detection logic.");
            }).catch(e => {
                if (killRequested) { return; }
                throw e;
            });

            return {
                output,
                started,
                completed: Promise.all([started, completed]).then(noop),
                kill: () => {
                    killRequested = true;
                    kill();
                },
            };
        }, { taskName: trimmedCommand });
    };
}

// istanbul ignore next
const buildEnv = (opts: CmdOptions) => Object.assign({
    FORCE_COLOR: opts.supportsColor ? "1" : undefined,
}, process.env);

export const cmd = setupCmd(spawn, buildEnv);
