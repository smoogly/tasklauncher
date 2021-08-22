import { setupCmd, CMDSpawnType, CmdOptions } from "./cmd";
import { SinonFakeTimers, SinonStub, stub, useFakeTimers } from "sinon";
import { createTestStream, TestStream } from "../util/create_test_stream";
import { ChildProcess } from "child_process";
import { expect } from "chai";
import { noop } from "../util/noop";
import { promiseStatus } from "../util/async";
import * as Observable from "zen-observable";

describe("Runners / cmd", () => {
    let timers: SinonFakeTimers;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let on: SinonStub<[string, (...args: any[]) => void]>;
    let stdout: TestStream<Buffer>;
    let stderr: TestStream<Buffer>;
    let kill: SinonStub<Parameters<ChildProcess["kill"]>, ReturnType<ChildProcess["kill"]>>;

    let env: Record<string, string>;
    let buildEnv: SinonStub<[CmdOptions], typeof env>;
    let spawn: SinonStub & CMDSpawnType;
    let cmd: ReturnType<typeof setupCmd>;

    let command: string;
    let task: ReturnType<typeof cmd>;
    let cmdOptions: CmdOptions;

    beforeEach(async () => {
        timers = useFakeTimers();

        stdout = createTestStream(timers);
        stderr = createTestStream(timers);
        kill = stub<Parameters<ChildProcess["kill"]>, ReturnType<ChildProcess["kill"]>>().returns(true);
        on = stub();

        const childProcess: ReturnType<CMDSpawnType> = {
            stdout: stdout.stream,
            stderr: stderr.stream,
            kill,
            on,
        };

        env = { envprop: "envvalue" };
        buildEnv = stub<[CmdOptions], typeof env>().returns(env);

        spawn = stub<Parameters<CMDSpawnType>, ReturnType<CMDSpawnType>>().returns(childProcess);
        cmd = setupCmd(spawn, buildEnv);

        command = "command  --arg=1  --arg2 2  whatever";
        task = cmd(command);
        cmdOptions = { supportsColor: false };
    });

    it("Should spawn the given executable and arguments", async () => {
        task(cmdOptions);
        expect(spawn.calledOnce).to.equal(true);
        expect(spawn.calledWith("command", ["--arg=1", "--arg2", "2", "whatever"])).to.equal(true);
    });

    it("Should throw if no executable is specified", async () => {
        expect(() => cmd("")).to.throw(/no executable/i);
    });

    it("Should pass the task input to env builder", async () => {
        task(cmdOptions);
        expect(buildEnv.calledOnce).to.equal(true);
        expect(buildEnv.firstCall.firstArg).to.equal(cmdOptions);
    });

    it("Should pass the env to spawn call", async () => {
        task(cmdOptions);
        const spawnOpts = spawn.getCall(0).lastArg;
        expect(spawnOpts).to.haveOwnProperty("env");
        expect(spawnOpts.env).to.deep.equal(env);
    });

    it("Should forward stdout and stderr", async () => {
        let captured = '';
        task(cmdOptions).output.subscribe(s => captured += s.toString("utf8"), noop);

        await stdout.write(Buffer.from("out"));
        await stderr.write(Buffer.from("err"));
        expect(captured).to.equal("outerr");
    });

    it("Should kill the child if kill is called", async () => {
        task(cmdOptions).kill();
        expect(kill.calledOnce).to.equal(true);
    });

    it("Should mark the task completed if child process exits with zero exit code", async () => {
        const status = promiseStatus(task(cmdOptions).completed);
        const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
        if (!exitSubscription) { throw new Error("Exit subscription not found"); }

        exitSubscription.lastArg(0, null);
        await timers.runAllAsync();

        expect(status()).to.equal("resolved");
    });

    it("Should mark the task completion rejected if child process exits with non-zero exit code", async () => {
        const status = promiseStatus(task(cmdOptions).completed);
        const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
        if (!exitSubscription) { throw new Error("Exit subscription not found"); }

        exitSubscription.lastArg(1, null);
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should mark the task completion rejected if child process exits with signal", async () => {
        const status = promiseStatus(task(cmdOptions).completed);
        const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
        if (!exitSubscription) { throw new Error("Exit subscription not found"); }

        const signal: NodeJS.Signals = "SIGKILL";
        exitSubscription.lastArg(null, signal);
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should mark the task completion rejected if child process errors", async () => {
        const status = promiseStatus(task(cmdOptions).completed);
        const errorSubscription = on.getCalls().find(c => c.firstArg === "error");
        if (!errorSubscription) { throw new Error("Error subscription not found"); }

        errorSubscription.lastArg(new Error("Failed to spawn"));
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    describe("without start detection", () => {
        it("Should mark the task started if task completes", async () => {
            const status = promiseStatus(task(cmdOptions).started);

            const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
            if (!exitSubscription) { throw new Error("Exit subscription not found"); }
            exitSubscription.lastArg(0, null);
            await timers.runAllAsync();

            expect(status()).to.equal("resolved");
        });

        it("Should mark the task start rejected if completion fails", async () => {
            const status = promiseStatus(task(cmdOptions).started);

            const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
            if (!exitSubscription) { throw new Error("Exit subscription not found"); }
            exitSubscription.lastArg(1, null);
            await timers.runAllAsync();

            expect(status()).to.equal("rejected");
        });
    });

    describe("with start detection", () => {
        let detectStart: SinonStub<[Observable<Buffer>, () => void], void>;
        beforeEach(async () => {
            detectStart = stub();
            task = cmd(command, detectStart);
        });

        it("Should call detectStart with task output", async () => {
            const { output } = task(cmdOptions);
            expect(detectStart.calledOnce).to.equal(true);
            expect(detectStart.firstCall.firstArg).to.equal(output);
        });

        it("Should mark the task started when detectStart calls the callback", async () => {
            const status = promiseStatus(task(cmdOptions).started);
            detectStart.firstCall.lastArg();
            await timers.runAllAsync();
            expect(status()).to.equal("resolved");
        });

        it("Should mark the task start rejected if detectStart fails", async () => {
            const err = new Error("Failure detecting start");
            detectStart.throws(err);
            const status = promiseStatus(task(cmdOptions).started);
            await timers.runAllAsync();
            expect(status()).to.equal("rejected");
        });

        it("Should mark the task completion rejected if detectStart fails", async () => {
            const err = new Error("Failure detecting start");
            detectStart.throws(err);
            const status = promiseStatus(task(cmdOptions).completed);
            await timers.runAllAsync();
            expect(status()).to.equal("rejected");
        });

        it("Should mark both task start and completion rejected if task completes before start is detected", async () => {
            const { started, completed } = task(cmdOptions);
            const startStatus = promiseStatus(started);
            const completionStatus = promiseStatus(completed);

            const exitSubscription = on.getCalls().find(c => c.firstArg === "exit");
            if (!exitSubscription) { throw new Error("Exit subscription not found"); }
            exitSubscription.lastArg(0, null);

            await timers.runAllAsync();
            expect(startStatus()).to.equal("rejected");
            expect(completionStatus()).to.equal("rejected");
        });
    });
});
