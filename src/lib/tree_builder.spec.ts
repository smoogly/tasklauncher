import { createTestTask, TestTask } from "./util/create_test_task";
import { expect } from "chai";
import { work } from "./work";

describe("work tree builder", () => {
    let target: TestTask;
    let dep1: TestTask = createTestTask();
    let dep2: TestTask = createTestTask();
    beforeEach(() => {
        target = createTestTask();
        dep1 = createTestTask();
        dep2 = createTestTask();
    });

    it("Should create a noop work tree if given no arguments", async () => {
        expect(work().getWorkTree()).to.deep.equal({ task: null, dependencies: [] });
    });

    it("Should specify the target task in the root of the work tree", async () => {
        expect(work(target.task).getWorkTree()).to.deep.equal({ task: target.task, dependencies: [] });
    });

    it("Should specify tasks as dependencies of noop work if multiple target tasks are given", async () => {
        expect(work(dep1.task, dep2.task).getWorkTree()).to.deep.equal({
            task: null,
            dependencies: [
                { task: dep1.task, dependencies: [] },
                { task: dep2.task, dependencies: [] },
            ],
        });
    });

    it("Should specify the dependencies of a noop task in the work tree", async () => {
        expect(work().after(dep1.task, dep2.task).getWorkTree()).to.deep.equal({
            task: null,
            dependencies: [
                { task: dep1.task, dependencies: [] },
                { task: dep2.task, dependencies: [] },
            ],
        });
    });

    it("Should specify the dependencies of the target task in the work tree", async () => {
        expect(work(target.task).after(dep1.task, dep2.task).getWorkTree()).to.deep.equal({
            task: target.task,
            dependencies: [
                { task: dep1.task, dependencies: [] },
                { task: dep2.task, dependencies: [] },
            ],
        });
    });

    it("Should specify the nested dependencies in the work tree", async () => {
        expect(work(target.task).after(dep1.task).after(dep2.task).getWorkTree()).to.deep.equal({
            task: target.task,
            dependencies: [
                {
                    task: dep1.task, dependencies: [
                        { task: dep2.task, dependencies: [] },
                    ],
                },
            ],
        });
    });

    it("Should append the dependency tree after each leaf node of current work tree", async () => {
        const nestedWork = work(createTestTask().task).after(createTestTask().task, createTestTask().task);
        const targetWork = work(target.task).after(dep1.task, dep2.task).after(nestedWork);

        expect(targetWork.getWorkTree()).to.deep.equal({
            task: target.task,
            dependencies: [
                {
                    task: dep1.task,
                    dependencies: [nestedWork.getWorkTree()],
                },
                {
                    task: dep2.task,
                    dependencies: [nestedWork.getWorkTree()],
                },
            ],
        });
    });

    it("Should throw if given a circular dependency", async () => {
        expect(() => work(target.task).after(target.task)).to.throw(/circular/i);
    });

    it("Should use the taskName prop for circular dependency description if it is available", async () => {
        const taskName = "some test task name";
        expect(() => work(Object.assign(target.task, { taskName })).after(target.task)).to.throw(new RegExp(taskName));
    });

    it("Should use the function name for circular dependency description if it is available", async () => {
        function myTestFunction () { return void 0; }
        expect(() => work(myTestFunction).after(myTestFunction)).to.throw(/myTestFunction/);
    });

    it("Should use function source for circular dependency description if it is available", async () => {
        const source = "My test function source";
        const task = Object.assign(() => void 0, { toString: () => source });
        expect(() => work(task).after(task)).to.throw(new RegExp(source));
    });

    it("Should display 'unknown' for circular dependency description if nothing else is available", async () => {
        const task = Object.assign(() => void 0, { toString: () => '' });
        expect(() => work(task).after(task)).to.throw(/unknown/);
    });

    it("Should display the task chain in single line if all task names are single line", async () => {
        const task = Object.assign(target.task, { taskName: "inline" });
        expect(() => work(task).after(task)).to.throw(/->/i);
    });

    it("Should display the task chain multiline if some task names are multi line", async () => {
        const task = Object.assign(target.task, { taskName: "multi\nline" });
        const other = Object.assign(dep1.task, { taskName: "inline" });
        expect(() => work(task).after(other).after(task)).to.throw(/\n↓\n/i);
    });
});
