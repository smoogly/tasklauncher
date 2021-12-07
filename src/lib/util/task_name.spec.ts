import { expect } from "chai";
import { createTestTask } from "../test_util/create_test_task";
import { taskName } from "./task_name";

describe("taskName", () => {
    it("Should use the taskName prop if it is available", async () => {
        const name = "some test task name";
        expect(taskName(Object.assign(createTestTask().task, { taskName: name }))).to.equal(name);
    });

    it("Should use the function name if it is available", async () => {
        function myTestFunction () { return void 0; }
        expect(taskName(myTestFunction)).to.equal("myTestFunction");
    });

    it("Should use function source if it is available", async () => {
        const source = "My test function source";
        const task = Object.assign(() => void 0, { toString: () => source });
        expect(taskName(task)).to.equal(source);
    });

    it("Should display 'unknown' for circular dependency description if nothing else is available", async () => {
        const task = Object.assign(() => void 0, { toString: () => "" });
        expect(taskName(task)).to.equal("unknown");
    });
});
