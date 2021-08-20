import { expect } from "chai";
import { createTestTask, TestTask } from "./util/create_test_task";
import { getDependencies, getRootTask, work } from "./work";
import { Fn, TaskTree } from "./work_api";

describe("Work utils", () => {
    let task: TestTask;
    beforeEach(() => {
        task = createTestTask();
    });

    describe("getRootTask", () => {
        it("Should return the task given a task function", async () => {
            expect(getRootTask(task.task)).to.equal(task.task);
        });

        it("Should return a root task from the task tree", async () => {
            expect(getRootTask({
                task: task.task,
                dependencies: []
            })).to.equal(task.task);
        });

        it("Should return a root task from the task tree builder", async () => {
            expect(getRootTask(work(task.task))).to.equal(task.task);
        });

        it("Should throw if given weird data", async () => {
            expect(() => getRootTask(1 as any)).to.throw(/unexpected work type/i);
        });
    });

    describe("getDependencies", () => {
        it("Should return an empty array given a task function", async () => {
            expect(getDependencies(task.task)).to.deep.equal([]);
        });

        it("Should return first level dependencies of a task tree", async () => {
            const tree: TaskTree<Fn> = {
                task: task.task,
                dependencies: [],
            };
            expect(getDependencies({
                task: null,
                dependencies: [tree],
            })).to.deep.equal([tree]);
        });

        it("Should return first level dependencies of a tree builder", async () => {
            expect(getDependencies(work().after(task.task))).to.deep.equal([{
                task: task.task,
                dependencies: [],
            }]);
        });

        it("Should throw if given weird data", async () => {
            expect(() => getDependencies(1 as any)).to.throw(/unexpected work type/i);
        });
    });
});
