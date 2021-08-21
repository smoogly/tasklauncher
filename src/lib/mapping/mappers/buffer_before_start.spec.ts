import { createTestTask, TestTask } from "../../util/create_test_task";
import { bufferBeforeStart } from "./buffer_before_start";
import { Execution } from "../../execution";
import { expect } from "chai";
import { SinonFakeTimers, useFakeTimers } from "sinon";
import { noop } from "../../util/noop";

describe("Mappers / Buffer before start", () => {
    let task: TestTask;
    let buffered = bufferBeforeStart(createTestTask().task);
    let bufferedExecution: Execution;
    let capturedOutput: string;
    let timers: SinonFakeTimers;

    beforeEach(async () => {
        timers = useFakeTimers();

        task = createTestTask();
        buffered = bufferBeforeStart(task.task);
        bufferedExecution = buffered();

        capturedOutput = "";
        bufferedExecution.output.subscribe(
            x => capturedOutput = capturedOutput + x.toString("utf8"),
            noop,
        );

        await timers.runAllAsync();
    });
    afterEach(() => {
       timers.restore();
    });

    it("Should not emit any output until the task has started", async () => {
        task.writeOutput("hey");
        expect(capturedOutput).to.equal("");
    });

    it("Should emit all output emitted before task started once it starts", async () => {
        task.writeOutput("hello");
        task.writeOutput("world");

        task.start.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.equal("helloworld");
    });

    it("Should emit output as it comes after the task is started", async () => {
        task.start.resolve();
        await timers.runAllAsync();

        task.writeOutput("hey");
        expect(capturedOutput).to.equal("hey");

        task.writeOutput("whop");
        expect(capturedOutput).to.equal("heywhop");
    });

    it("Should copy the task metadata", async () => {
        const res = bufferBeforeStart(Object.assign(task.task, { prop: 1 }));
        expect(res).to.haveOwnProperty("prop", 1);
    });
});
