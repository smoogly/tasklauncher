import { createTestTask, TestTask } from "../../util/create_test_task";
import { setupAnnotator } from "./annotate";
import { Execution } from "../../execution";
import { expect } from "chai";
import { SinonFakeTimers, SinonStub, stub, useFakeTimers } from "sinon";
import { observableStatus } from "../../util/observable";
import { noop } from "../../util/noop";

describe("Mappers / Annotate", () => {
    let task: TestTask;
    let taskName = "name";

    let durationStr: string;
    let formatDuration: SinonStub<[number], string>;

    let annotate: ReturnType<typeof setupAnnotator>;
    let annotated: TestTask["task"];
    let annotatedExecution: Execution;
    let capturedOutput: string;

    let timers: SinonFakeTimers;

    beforeEach(async () => {
        timers = useFakeTimers();

        task = createTestTask();
        taskName = "some task name";

        durationStr = "duration";
        formatDuration = stub<[number], string>().returns(durationStr);

        annotate = setupAnnotator(formatDuration);
        annotated = annotate(Object.assign(task.task, { taskName }));
        annotatedExecution = annotated();

        capturedOutput = "";
        annotatedExecution.output.subscribe(
            x => capturedOutput = capturedOutput + x.toString("utf8"),
            noop,
        );
        await timers.runAllAsync();
    });

    it("Should pipe the original output", async () => {
        const message = "Hello, World!";
        task.writeOutput(message);
        expect(capturedOutput).to.contain(message);
    });

    it("Should emit that the task has started", async () => {
        expect(capturedOutput).to.contain(`Running ${ taskName }`);
    });

    it("Should emit that the long-running task has started", async () => {
        task.start.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(`Started ${ taskName }`);
    });

    it("Should emit the time it took to start a long-running task", async () => {
        durationStr = "long-running task start duration";
        formatDuration.returns(durationStr);

        task.start.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(durationStr);
    });

    it("Should emit that the task has completed", async () => {
        task.start.resolve();
        task.completion.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(`Completed ${ taskName }`);
    });

    it("Should emit time it took to complete the task", async () => {
        durationStr = "short-running task duration";
        formatDuration.returns(durationStr);

        task.start.resolve();
        task.completion.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(durationStr);
    });

    it("Should not emit time it took to complete the task that runs long after start ", async () => {
        durationStr = "long-running task duration";
        formatDuration.returns(durationStr);

        task.start.resolve();
        await timers.runAllAsync();

        task.completion.resolve();
        await timers.runAllAsync();

        const logAfterCompletion = capturedOutput.toLowerCase().split("completed")[1];
        expect(logAfterCompletion).to.not.contain(durationStr);
    });

    it("Should not emit that the task has started if it completes soon after", async () => {
        task.start.resolve();
        task.completion.resolve();
        await timers.runAllAsync();

        expect(capturedOutput).to.not.contain("Started");
    });

    it("Should emit that the task has failed before start", async () => {
        task.start.reject();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(`Failed ${ taskName }`);
    });

    it("Should emit that the task has failed after start", async () => {
        task.start.resolve();
        task.completion.reject();
        await timers.runAllAsync();

        expect(capturedOutput).to.contain(`Failed ${ taskName }`);
    });

    it("Should set observable rejected on error", async () => {
        const outputStatus = observableStatus(annotatedExecution.output);
        task.start.reject();
        await timers.runAllAsync();
        expect(outputStatus()).to.equal("rejected");
    });

    it("Should set observable completed after the task is done", async () => {
        const outputStatus = observableStatus(annotatedExecution.output);
        task.start.resolve();
        task.completion.resolve();
        await timers.runAllAsync();
        expect(outputStatus()).to.equal("completed");
    });
});
