import { createTestTask, TestTask } from "../../util/create_test_task";
import { setupHeartbeat } from "./heartbeat";
import { SinonFakeTimers, SinonStub, stub, useFakeTimers } from "sinon";
import { Execution } from "../../execution";
import { expect } from "chai";
import { noop } from "../../util/noop";

type ScheduleHeartbeat = Parameters<typeof setupHeartbeat>[0];
describe("Mappers / Heartbeat", () => {
    let scheduleHeartbeat: SinonStub<Parameters<ScheduleHeartbeat>, ReturnType<ScheduleHeartbeat>>;
    let stopHeartbeat: SinonStub<Parameters<ReturnType<ScheduleHeartbeat>>, ReturnType<ReturnType<ScheduleHeartbeat>>>;
    let formatDuration: SinonStub<[number], string>;
    let heartbeat: ReturnType<typeof setupHeartbeat>;

    let taskName: string;
    let task: TestTask;
    let withHeartbeat: TestTask["task"];
    let executionWithHeartbeat: Execution;
    let capturedOutput: string;

    let timers: SinonFakeTimers;

    beforeEach(async () => {
        timers = useFakeTimers();

        stopHeartbeat = stub();
        scheduleHeartbeat = stub<Parameters<ScheduleHeartbeat>, ReturnType<ScheduleHeartbeat>>().returns(stopHeartbeat);

        formatDuration = stub<[number], string>().returns("");
        heartbeat = setupHeartbeat(scheduleHeartbeat, formatDuration);

        task = createTestTask();
        taskName = "my test task";
        withHeartbeat = heartbeat(Object.assign(task.task, { taskName }));
        executionWithHeartbeat = withHeartbeat();

        capturedOutput = "";
        executionWithHeartbeat.output.subscribe(
            x => capturedOutput = capturedOutput + x.toString("utf8"),
            noop
        );
        await timers.runAllAsync();
    });

    it("Should pipe the original output", async () => {
        const message = "Hello, World!";
        task.writeOutput(message);
        expect(capturedOutput).to.contain(message);
    });

    it("Should call to schedule the heartbeat", async () => {
        expect(scheduleHeartbeat.calledOnce).to.equal(true);
    });

    it("Should display the heartbeat", async () => {
        scheduleHeartbeat.firstCall.args[0]();
        expect(capturedOutput.toLowerCase()).to.contain('still running');
        expect(capturedOutput).to.contain(taskName);
    });

    it("Should specify how long is the task running", async () => {
        const duration = "duration right this moment";
        formatDuration.returns(duration);
        scheduleHeartbeat.firstCall.args[0]();
        expect(capturedOutput).to.contain(duration);
    });

    it("Should stop the heartbeat after the task starts", async () => {
        task.start.resolve();
        await timers.runAllAsync();
        expect(stopHeartbeat.calledOnce).to.equal(true);
    });

    it("Should stop the heartbeat if the task start rejects", async () => {
        task.start.reject();
        await timers.runAllAsync();
        expect(stopHeartbeat.calledOnce).to.equal(true);
    });

    it("Should stop the heartbeat after the task completes", async () => {
        task.completion.resolve();
        await timers.runAllAsync();
        expect(stopHeartbeat.calledOnce).to.equal(true);
    });

    it("Should stop the heartbeat if the task completion rejects", async () => {
        task.completion.reject();
        await timers.runAllAsync();
        expect(stopHeartbeat.calledOnce).to.equal(true);
    });
});
