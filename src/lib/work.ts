import { Fn, TaskTree, TreeBuilder, Work, WorkType } from "./work_api";
import { noop } from "./util/noop";

export const isTreeBuilder = <T extends Fn>(work: Work<T>): work is TreeBuilder<T> => Boolean(work) && typeof work === "object" && "getWorkTree" in work;
export const isTaskTree = <T extends Fn>(work: Work<T>): work is TaskTree<T> => Boolean(work) && typeof work === "object" && "task" in work;

export function getRootTask<T extends Fn>(work: Work<T>): T | null {
    if (isTreeBuilder(work)) { return getRootTask(work.getWorkTree()); }
    if (isTaskTree(work)) { return work.task; }
    if (typeof work === "function") { return work; }
    throw new Error(`Unexpected work type: ${ work }`);
}
export function getDependencies<T extends Fn>(work: Work<T>): TaskTree<T>[] {
    if (isTreeBuilder(work)) { return work.getWorkTree().dependencies; }
    if (isTaskTree(work)) { return work.dependencies; }
    if (typeof work === "function") { return []; }
    throw new Error(`Unexpected work type: ${ work }`);
}

const exactlyOne = <T>(val: T[]): val is [T] => val.length === 1;
const _traversePostVisit = (tree: TaskTree<Fn>, cb: (node: TaskTree<Fn>) => void, visited: Fn[]) => {
    if (tree.task && visited.includes(tree.task)) { throw new Error("Circular dependency"); }
    tree.dependencies.forEach(node => _traversePostVisit(node, cb, tree.task ? [...visited, tree.task] : visited));
    cb(tree);
};
const traversePostVisit = (tree: TaskTree<Fn>, cb: (node: TaskTree<Fn>) => void) => _traversePostVisit(tree, cb, []);

export function _work(tasks: Work<Fn>[], dependencies: Work<Fn>[]): TreeBuilder<Fn> {
    const workTree: TaskTree<Fn> = exactlyOne(tasks)
        ? {
            task: getRootTask(tasks[0]),
            dependencies: getDependencies(tasks[0]),
        }
        : {
            task: null,
            dependencies: tasks.map(item => ({
                task: getRootTask(item),
                dependencies: getDependencies(item),
            }))
        };

    if (dependencies.length > 0) {
        const dependencyTree = _work(dependencies, []).getWorkTree();
        const resultingDependencies = dependencyTree.task === null
            ? dependencyTree.dependencies
            : [dependencyTree];

        // Push dependencies in the end of the work tree
        traversePostVisit(workTree, node => {
            if (node.dependencies.length > 0) { return; }
            node.dependencies = resultingDependencies;
        });
    }

    // Check for circular dependencies
    traversePostVisit(workTree, noop);

    return {
        getWorkTree: () => workTree,
        after: (...items) => _work([workTree], items),
    };
}

export function work<WorkItems extends Work<Fn>[]>(...workItems: WorkItems): TreeBuilder<WorkType<WorkItems[number]>> {
    return _work(workItems, []) as TreeBuilder<WorkType<WorkItems[number]>>;
}
