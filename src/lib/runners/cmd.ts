import { spawn } from "child_process";
import * as Observable from "zen-observable";

import { Task } from "../work_api";
import { observableFromStream } from "../util/observable";
import { Execution } from "../execution";
import { merge } from "zen-observable/extras";


export type StartDetector = (output: Observable<Buffer>, started: () => void) => void;
export type CmdOptions = { supportsColor?: boolean };

export function cmd(
    command: string,
    detectStart?: StartDetector,
): Task<CmdOptions, Execution> & { taskName: string } {
    const cmd = command.replace(/\s+/g, " ").trim();
    const [executable, ...args] = cmd.split(" ");
    if (!executable) { throw new Error("No executable given"); }

    return Object.assign((input: CmdOptions): Execution => {
        const child = spawn(executable, args, {
            env: Object.assign({}, process.env, {
                FORCE_COLOR: input.supportsColor ? "1" : undefined,
            }),
        });

        const output = merge(observableFromStream(child.stdout), observableFromStream(child.stderr));
        const completed = new Promise<void>((res, rej) => {
            child.on("error", err => {
                rej(err);
            });
            child.on("exit", (code) => {
                if (code !== 0) {
                    rej(new Error(`Terminated with non-zero code '${ code }': ${ cmd }`));
                } else {
                    res();
                }
            });
        });

        return {
            output,
            completed,
            kill: () => child.kill(),
            started: !detectStart ? completed : new Promise(res => detectStart(output, res)),
        };
    }, { taskName: cmd });
}
