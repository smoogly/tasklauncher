import { expect } from "chai";
import { SinonStub, stub } from "sinon";
import { createTestTask, TestTask } from "../util/create_test_task";
import { Fn, Input, TaskTree, TreeBuilder, WorkType } from "../work_api";
import { isTaskTree, work } from "../work";
import { map } from "./map";

describe("map", () => {
    let target: TestTask;
    let dep1: TestTask = createTestTask();
    let dep2: TestTask = createTestTask();
    let common: TestTask = createTestTask();
    let workTree: TreeBuilder<TestTask["task"]>;

    let transform: SinonStub<[Fn], Fn>;
    beforeEach(() => {
        target = createTestTask();
        dep1 = createTestTask();
        dep2 = createTestTask();
        common = createTestTask();

        const branch1 = work().after(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task)
        workTree = work(target.task).after(branch1, branch2);

        transform = stub<[Fn], Fn>().returnsArg(0);
    });

    it("Should call the transformation with every task in the tree", async () => {
        map(workTree, transform);
        expect(transform.calledWithExactly(target.task)).to.equal(true);
        expect(transform.calledWithExactly(dep1.task)).to.equal(true);
        expect(transform.calledWithExactly(dep2.task)).to.equal(true);
        expect(transform.calledWithExactly(common.task)).to.equal(true);
    });

    it("Should not call the transformation with noop work", async () => {
        map(workTree, transform);
        expect(transform.calledWith(null as any)).to.equal(false);
    });

    it("Should pass a common dependency to transformation once", async () => {
        map(workTree, transform);
        const commonTaskCalls = transform.getCalls().filter(c => c.firstArg === common.task);
        expect(commonTaskCalls).to.have.lengthOf(1);
    });

    it("Should return a mapped tree", async () => {
        expect(isTaskTree(map(workTree, transform))).to.equal(true);
    });

    it("Should preserve common dependency as same by reference", async () => {
        const result = map(workTree, original => {
            const mapped = (arg: Input<typeof original>) => original(arg);
            return Object.assign(mapped, { original });
        });

        const traverse = <T extends Fn>(node: TaskTree<T>, cb: (task: T) => void): void => {
            if (node.task) { cb(node.task); }
            node.dependencies.forEach(dep => traverse(dep, cb));
        };

        const mappedCommonTasks: WorkType<typeof result>[] = [];
        traverse(result, task => {
            if (task.original === common.task) {
                mappedCommonTasks.push(task);
            }
        });

        expect(mappedCommonTasks).to.have.lengthOf(2);
        expect(mappedCommonTasks[0] === mappedCommonTasks[1]).to.equal(true);
    });
});
