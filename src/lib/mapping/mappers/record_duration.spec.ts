import { createTestTask } from "../../util/create_test_task";
import { recordDuration } from "./record_duration";
import { SinonFakeTimers, useFakeTimers } from "sinon";
import { expect } from "chai";

describe("Mapper / RecordDuration", () => {
    let timers: SinonFakeTimers;
    beforeEach(async () => {
        timers = useFakeTimers();
    });

    it("Should record task duration to completion", async () => {
        const task = createTestTask();
        const mapped = recordDuration(task.task);
        const execution = mapped();

        task.start.resolve();
        timers.tick(100);

        task.completion.resolve();
        await timers.runAllAsync();

        expect(await execution.duration).to.equal(100);
    });

    it("Should record null if task completion rejects", async () => {
        const task = createTestTask();
        const mapped = recordDuration(task.task);
        const execution = mapped();

        task.completion.reject();
        await timers.runAllAsync();

        expect(await execution.duration).to.equal(null);
    });
});
