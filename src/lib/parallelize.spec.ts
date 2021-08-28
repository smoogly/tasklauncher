import { expect } from "chai";
import * as Observable from "zen-observable";
import { parallelize } from "./parallelize";
import { promiseStatus } from "./test_util/async";
import { work } from "./work";
import { createTestTask, TestTask } from "./test_util/create_test_task";
import { observableStatus } from "./util/observable";
import { SinonFakeTimers, SinonStub, useFakeTimers } from "sinon";
import { noop } from "./util/noop";
import { Input, Meta, Output, Task, Work } from "./work_api";
import { Execution } from "./execution";
import { map } from "./mapping/map";
import { copyMeta } from "./util/meta";
import { isNotNull } from "./util/typeguards";


describe("parallelize", () => {
    let target: TestTask;
    let dep1: TestTask;
    let dep2: TestTask;
    let common: TestTask;

    let timers: SinonFakeTimers;
    beforeEach(() => {
        target = createTestTask();
        dep1 = createTestTask();
        dep2 = createTestTask();
        common = createTestTask();

        timers = useFakeTimers();
    });
    afterEach(() => {
        timers.restore();
    });

    it("Should execute all tasks", async () => {
        const execution = parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve(); dep1.completion.resolve();
        dep2.start.resolve(); dep2.completion.resolve();
        target.start.resolve(); target.completion.resolve();
        await execution.completed;

        [dep1.task, dep2.task, target.task].forEach(t => {
            expect(t.calledOnce).to.equal(true);
        });
    });

    it("Should provide the input to each task", async () => {
        const input = { input: "input" };
        const typedWork = work(target.task).after(dep1.task).after(dep2.task) as unknown as Work<Task<typeof input, Execution>>;
        const execution = parallelize(typedWork)(input);

        dep1.start.resolve(); dep1.completion.resolve();
        dep2.start.resolve(); dep2.completion.resolve();
        target.start.resolve(); target.completion.resolve();
        await execution.completed;

        [dep1.task, dep2.task, target.task].forEach(t => {
            const mock = t as unknown as SinonStub<[typeof input], Execution>;
            expect(mock.calledWithExactly(input)).to.equal(true);
        });
    });

    it("should execute dependencies before executing the target task", async () => {
        parallelize(work(target.task).after(dep1.task, dep2.task))();
        await timers.runAllAsync();

        expect(dep1.task.calledOnce).to.equal(true);
        expect(dep2.task.calledOnce).to.equal(true);
        expect(target.task.called).to.equal(false);
    });

    it("Should execute the target task after the dependencies have started", async () => {
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve();
        dep2.start.resolve();
        await Promise.all([dep1.start.promise, dep2.start.promise]);
        await timers.runAllAsync();

        expect(target.task.calledOnce).to.equal(true);
    });

    it("Should execute nested dependencies before executing first-level dependencies", async () => {
        parallelize(work(target.task).after(dep1.task).after(dep2.task))();
        await timers.runAllAsync();

        expect(dep2.task.calledOnce).to.equal(true);
        expect(dep1.task.called).to.equal(false);
        expect(target.task.called).to.equal(false);
    });

    it("Should execute the first-level dependencies after the nested dependencies have started", async () => {
        parallelize(work(target.task).after(dep1.task).after(dep2.task))();

        dep2.start.resolve();
        await dep2.start.promise;
        await timers.runAllAsync();

        expect(dep1.task.calledOnce).to.equal(true);
        expect(target.task.called).to.equal(false);
    });

    it("Should mark the noop execution started", async () => {
        const status = promiseStatus(parallelize(work())({}).started);
        await timers.runAllAsync();
        expect(status()).to.equal("resolved");
    });

    it("Should mark the noop execution completed", async () => {
        const status = promiseStatus(parallelize(work())({}).completed);
        await timers.runAllAsync();
        expect(status()).to.equal("resolved");
    });

    it("Should mark the execution started when root task is started", async () => {
        const status = promiseStatus(parallelize(work(target.task))().started);
        expect(status()).to.equal("running");

        target.start.resolve();
        await timers.runAllAsync();

        expect(status()).to.equal("resolved");
    });

    it("Should mark the execution completed when root task is completed", async () => {
        const status = promiseStatus(parallelize(work(target.task))().completed);
        expect(status()).to.equal("running");

        target.start.resolve();
        target.completion.resolve();
        await timers.runAllAsync();

        expect(status()).to.equal("resolved");
    });

    it("Should mark the execution completed only after the dependencies are completed", async () => {
        const status = promiseStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().completed);

        dep1.start.resolve();
        dep2.start.resolve();

        target.start.resolve();
        target.completion.resolve();
        await timers.runAllAsync();

        expect(status()).to.equal("running");

        dep1.completion.resolve();
        dep2.completion.resolve();
        await timers.runAllAsync();

        expect(status()).to.equal("resolved");
    });

    it("Should kill the dependencies after the root task is completed", async () => {
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve();
        dep2.start.resolve();
        target.start.resolve();
        await timers.runAllAsync();

        expect(dep1.kill.called).to.equal(false);
        expect(dep2.kill.called).to.equal(false);

        target.completion.resolve();
        await timers.runAllAsync();

        expect(dep1.kill.calledOnce).to.equal(true);
        expect(dep2.kill.calledOnce).to.equal(true);
    });

    it("Should kill the root task if execution is killed after the task is started", async () => {
        const execution = parallelize(work(target.task))();
        await timers.runAllAsync();

        execution.kill();
        await timers.runAllAsync();

        expect(target.kill.calledOnce).to.equal(true);
    });

    it("Should not run the root task if execution is killed before dependencies started", async () => {
        const execution = parallelize(work(target.task).after(dep1.task, dep2.task))();
        execution.kill();

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        // Even though dependencies have started, root task shouldn't be invoked since execution is killed
        expect(target.task.called).to.equal(false);
    });

    it("Should kill the dependencies if execution is killed", async () => {
        const execution = parallelize(work(target.task).after(dep1.task, dep2.task))();
        await timers.runAllAsync();

        execution.kill();
        await timers.runAllAsync();

        expect(dep1.kill.calledOnce).to.equal(true);
        expect(dep2.kill.calledOnce).to.equal(true);
    });

    it("Should kill the dependencies if root task failed", async () => {
        target.task.throws();
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        // Should be killed because task rejects
        expect(dep1.kill.calledOnce).to.equal(true);
        expect(dep2.kill.calledOnce).to.equal(true);
    });

    it("Should not run the root task if one of the dependencies throws before start", async () => {
        dep1.task.throws();
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        expect(target.task.called).to.equal(false);
    });

    it("Should kill other dependencies if one of the dependencies throws before start", async () => {
        dep1.task.throws();
        parallelize(work(target.task).after(dep1.task, dep2.task))();
        await timers.runAllAsync();

        expect(dep2.kill.calledOnce).to.equal(true);
    });

    it("Should only kill the task once if execution is killed multiple times", async () => {
        const execution = parallelize(work(target.task))();
        await timers.runAllAsync();

        execution.kill();
        execution.kill();
        execution.kill();
        await timers.runAllAsync();

        expect(target.kill.calledOnce).to.equal(true);
    });

    it("Should mark the execution completion rejected if one of the dependencies throws before start", async () => {
        dep1.task.throws();
        const status = promiseStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().completed);
        await timers.runAllAsync();
        expect(status()).to.equal("rejected");
    });

    it("Should mark the execution start rejected if one of the dependencies throws before start", async () => {
        dep1.task.throws();
        const status = promiseStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().started);
        await timers.runAllAsync();
        expect(status()).to.equal("rejected");
    });

    it("Should not run the root task if one of the dependencies rejects after start, while another is still starting", async () => {
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.reject();
        await timers.runAllAsync();

        dep2.start.resolve();
        await timers.runAllAsync();

        expect(target.task.called).to.equal(false);
    });

    it("Should kill other dependencies if one of the dependencies rejects after start", async () => {
        parallelize(work(target.task).after(dep1.task, dep2.task))();

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        dep1.completion.reject();
        await timers.runAllAsync();

        expect(dep2.kill.calledOnce).to.equal(true);
    });

    it("Should mark the execution completion rejected if one of the dependencies rejects after start", async () => {
        const status = promiseStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().completed);

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        dep1.completion.reject();
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should mark the execution start rejected if one of the dependencies rejects after start, but before target is started", async () => {
        const status = promiseStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().started);

        dep1.start.resolve();
        dep2.start.resolve();
        await timers.runAllAsync();

        dep1.completion.reject();
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should only execute a dependency once if it is specified by multiple tasks in the work tree", async () => {
        const branch1 = work(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        const execution = parallelize(work(target.task).after(branch1, branch2))();

        common.start.resolve(); common.completion.resolve();
        dep1.start.resolve(); dep1.completion.resolve();
        dep2.start.resolve(); dep2.completion.resolve();
        target.start.resolve(); target.completion.resolve();

        await execution.completed;
        expect(common.task.calledOnce).to.equal(true);
    });

    it("Should not kill a dependency used by another task", async () => {
        const branch1 = work(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        parallelize(work(target.task).after(branch1, branch2))();

        common.start.resolve();
        dep2.start.resolve();
        dep1.start.resolve();
        dep1.completion.resolve();
        await timers.runAllAsync();

        expect(common.kill.called).to.equal(false);
    });

    it("Should kill a common dependency after the tasks depending on it complete", async () => {
        const branch1 = work(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        parallelize(work(target.task).after(branch1, branch2))();

        common.start.resolve();
        dep2.start.resolve();
        dep1.start.resolve();
        dep1.completion.resolve();
        dep2.completion.resolve();
        await timers.runAllAsync();

        expect(common.kill.calledOnce).to.equal(true);
    });

    it("Should kill a common dependency if one of the tasks depending on it rejects", async () => {
        const branch1 = work(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        parallelize(work(target.task).after(branch1, branch2))();

        common.start.resolve();
        dep2.start.resolve();
        dep1.start.reject();
        await timers.runAllAsync();

        expect(common.kill.calledOnce).to.equal(true);
    });

    it("Should provide the root task output as it is given", async () => {
        const execution = parallelize(target.task)();

        const captured: Buffer[] = [];
        execution.output.subscribe(x => captured.push(x));
        await timers.runAllAsync();

        target.writeOutput("before1");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1");

        target.writeOutput("before2");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2");


        target.start.resolve();
        await timers.runAllAsync();

        target.writeOutput("after1");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2after1");

        target.writeOutput("after2");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2after1after2");
    });

    it("Should provide the dependency output as it is given", async () => {
        const execution = parallelize(work(target.task).after(dep1.task))();

        const captured: Buffer[] = [];
        execution.output.subscribe(x => captured.push(x));
        await timers.runAllAsync();

        dep1.writeOutput("before1");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1");

        dep1.writeOutput("before2");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2");


        dep1.start.resolve();
        await timers.runAllAsync();

        dep1.writeOutput("after1");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2after1");

        dep1.writeOutput("after2");
        await timers.runAllAsync();
        expect(Buffer.concat(captured).toString("utf8")).to.equal("before1before2after1after2");
    });

    it("Should reject the observable if task throws before start", async () => {
        target.task.throws();
        const status = observableStatus(parallelize(target.task)().output);
        await timers.runAllAsync();
        expect(status()).to.equal("rejected");
    });

    it("Should reject the observable if dependency throws before start", async () => {
        dep1.task.throws();
        const status = observableStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().output);
        await timers.runAllAsync();
        expect(status()).to.equal("rejected");
    });

    it("Should reject the observable if task rejects after start", async () => {
        const status = observableStatus(parallelize(target.task)().output);

        target.start.resolve();
        await timers.runAllAsync();

        target.completion.reject();
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should reject the observable if dependency rejects after start", async () => {
        const status = observableStatus(parallelize(work(target.task).after(dep1.task, dep2.task))().output);

        dep1.start.resolve();
        dep2.start.resolve();
        target.start.resolve();
        await timers.runAllAsync();

        dep1.completion.reject();
        await timers.runAllAsync();

        expect(status()).to.equal("rejected");
    });

    it("Should complete the observable after the task completes", async () => {
        const status = observableStatus(parallelize(target.task)().output);

        target.start.resolve();
        target.completion.resolve();
        await timers.runAllAsync();

        expect(status()).to.equal("completed");
    });

    it("Should complete the observable for a noop task", async () => {
        const status = observableStatus(parallelize(work())({}).output);
        await timers.runAllAsync();

        expect(status()).to.equal("completed");
    });

    it("Should stop any output after a dependency completion has rejected", async () => {
        const branch1 = work(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        const execution = parallelize(work(target.task).after(branch1, branch2))();

        let output = "";
        execution.output.subscribe(
            next => output += next.toString("utf8"),
            noop, // Ignore errors
        );

        const tasks = [common, dep1, dep2, target];
        tasks.forEach(t => t.start.resolve());
        await timers.runAllAsync();

        dep1.completion.reject();
        await timers.runAllAsync();

        tasks.forEach(t => t.writeOutput("output"));
        expect(output).to.equal(""); // Each task had output, but it's not propagate
    });

    it("Should only pipe common task output once", async () => {
        const commonTaskOutput = "output";
        const commonTask = (): Execution => ({
            kill: noop,
            started: Promise.resolve(),
            completed: Promise.resolve(),
            output: new Observable<Buffer>(s => {
                s.next(Buffer.from(commonTaskOutput));
                s.complete();
            }),
        });

        const branch1 = work(dep1.task).after(commonTask);
        const branch2 = work(dep2.task).after(commonTask);
        const execution = parallelize(work(target.task).after(branch1, branch2))();

        let output = "";
        execution.output.subscribe(next => output += next.toString("utf8"));
        await timers.runAllAsync();

        expect(output).to.equal(commonTaskOutput);
    });

    it("Should resolve with null stats for noop execution when completed", async () => {
        const stats = await parallelize(work())({}).completed;
        expect(stats).to.deep.equal({ stats: null, dependencies: [] });
    });

    it("Should resolve with execution stats for the task tree when completed", async () => {
        const taggedCommon = Object.assign(common.task, { tag: "common" });
        const branch1 = work(Object.assign(dep1.task, { tag: "dep1" })).after(taggedCommon);
        const branch2 = work(Object.assign(dep2.task, { tag: "dep2" })).after(taggedCommon);
        const allWork = work(Object.assign(target.task, { tag: "target" })).after(branch1, branch2);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function tagExecution<T extends Task<any, object> & { tag: string }>(fn: T) {
            function tagged(input: Input<T>) {
                return { ...fn(input), tag: fn.tag };
            }

            return copyMeta(tagged, fn) as Task<Input<T>, Output<T> & { tag: string }> & Meta<T>;
        }

        const execution = parallelize(map(allWork, tagExecution))();

        const tasks = [common, dep1, dep2, target];
        tasks.forEach(t => {
            t.start.resolve();
            t.completion.resolve();
        });
        await timers.runAllAsync();

        const stats = await execution.completed;
        expect(stats.stats?.task.tag).to.equal("target");
        expect(stats.stats?.output.tag).to.equal("target");
        expect(stats.dependencies).to.have.lengthOf(2);

        const getTags = (s: typeof stats): string[] => [s.stats?.output.tag ?? null, ...s.dependencies.flatMap(getTags)].filter(isNotNull);
        expect(getTags(stats)).to.deep.equal(["target", "dep1", "common", "dep2", "common"]);
    });
});
