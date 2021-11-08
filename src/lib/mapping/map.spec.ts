import { expect } from "chai";
import { SinonStub, stub } from "sinon";
import { createTestTask, TestTask } from "../test_util/create_test_task";
import { Fn, Input, TaskTree, TreeBuilder, WorkType, WrappedTask } from "../work_api";
import { getRootTask, isTaskTree, work } from "../work";
import { map } from "./map";

const traverse = <T extends Fn>(node: TaskTree<T>, cb: (task: T | WrappedTask<T>) => void): void => {
    if (node.task) { cb(node.task); }
    node.dependencies.forEach(dep => traverse(dep, cb));
};

type MarkedTestTask = Omit<TestTask, "task"> & { task: TestTask["task"] & { marker: string } };
describe("map", () => {
    let target: MarkedTestTask;
    let dep1: MarkedTestTask;
    let dep2: MarkedTestTask;
    let common: MarkedTestTask;
    let workTree: TreeBuilder<MarkedTestTask["task"]>;

    let transform: SinonStub<[Fn], Fn>;
    beforeEach(() => {
        const ctt = (marker: string): MarkedTestTask => {
            const t = createTestTask();
            Object.assign(t.task, { marker });
            return t as never;
        };

        target = ctt("target");
        dep1 = ctt("dep1");
        dep2 = ctt("dep2");
        common = ctt("common");

        const branch1 = work().after(dep1.task).after(common.task);
        const branch2 = work(dep2.task).after(common.task);
        workTree = work(target.task).after(branch1, branch2);

        transform = stub<[Fn], Fn>().returnsArg(0);
    });

    it("Should call the transformation with every task in the tree", async () => {
        map(workTree, transform);
        [target, dep1, dep2, common].forEach(t => {
            const matchingCall = transform.getCalls().find(c => c.firstArg.marker === t.task.marker);
            expect(matchingCall).to.not.equal(undefined);
        });
    });

    it("Should not call the transformation with noop work", async () => {
        map(work(), transform);
        expect(transform.called).to.equal(false);
    });

    it("Should pass a common dependency to transformation once", async () => {
        map(workTree, transform);
        const commonTaskCalls = transform.getCalls().filter(c => c.firstArg.marker === common.task.marker);
        expect(commonTaskCalls).to.have.lengthOf(1);
    });

    it("Should call the transformation exactly once for each uniq work item in the tree", async () => {
        map(workTree, transform);
        expect(transform.callCount).to.equal(4);
    });

    it("Should return a mapped tree", async () => {
        expect(isTaskTree(map(workTree, transform))).to.equal(true);
    });

    it("Should preserve common dependency as same by reference", async () => {
        const result = map(workTree, original => {
            const mapped = (arg: Input<typeof original>) => original(arg);
            return Object.assign(mapped, { original: original.marker });
        });

        const mappedCommonTasks: WorkType<typeof result>[] = [];
        traverse(result, task => {
            if ("original" in task && task.original === common.task.marker) {
                mappedCommonTasks.push(task);
            }
        });

        expect(mappedCommonTasks).to.have.lengthOf(2);
        expect(mappedCommonTasks[0] === mappedCommonTasks[1]).to.equal(true);
    });

    it("Should transform the work returned by wrapper task into a task tree", async () => {
        const res = getRootTask(map(work(() => work()), transform));
        if (!res) { throw new Error("Expected a task"); }

        const furtherWork = res(void 0);
        expect(isTaskTree(furtherWork)).to.equal(true);
    });

    it("Should map the work returned by wrapper task", async () => {
        const res = getRootTask(map(() => workTree, (original: MarkedTestTask["task"]) => { // TODO: remove explicit type annotation -- should work implicitly
            const mapped = (arg: Input<typeof original>) => original(arg);
            return Object.assign(mapped, { original: original.marker });
        }));
        if (!res) { throw new Error("Expected a task"); }

        const furtherWork = res(void 0) as TaskTree<TestTask["task"] & { original: string }>; // TODO: remove type cast -- should work OK without one
        const markers: string[] = [];
        traverse(furtherWork, t => {
           if ("original" in t) { markers.push(t.original); }
        });

        expect(markers.sort()).to.deep.equal(["common", "common", "dep1", "dep2", "target"]);
    });

    it("Should map the deeply nested work", async () => {
        const res = getRootTask(map(() => () => () => workTree, transform));
        if (!res) { throw new Error("Expected a task"); }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const furtherWork = (res(void 0) as any).task().task(); // TODO: remove type cast
        expect(isTaskTree(furtherWork)).to.equal(true);
        expect(furtherWork.task).to.haveOwnProperty("marker", target.task.marker);
    });

    it("Should return a function that throws if original throws", async () => {
        const err = new Error("Throw!");
        target.task.throws(err);

        const res = map(target.task, transform);
        expect(res.task).to.throw(err.message);
    });
});
