import { Fn, TaskTree, TreeBuilder, Work, WorkType } from "./work_api";
import { noop } from "./util/noop";

export const isTreeBuilder = <T extends Fn>(wrk: Work<T>): wrk is TreeBuilder<T> => Boolean(wrk) && typeof wrk === "object" && "getWorkTree" in wrk;
export const isTaskTree = <T extends Fn>(wrk: Work<T>): wrk is TaskTree<T> => Boolean(wrk) && typeof wrk === "object" && "task" in wrk;

export function getRootTask<T extends Fn>(wrk: Work<T>): T | null {
    if (isTreeBuilder(wrk)) { return getRootTask(wrk.getWorkTree()); }
    if (isTaskTree(wrk)) { return wrk.task; }
    if (typeof wrk === "function") { return wrk; }
    throw new Error(`Unexpected work type: ${ wrk }`);
}
export function getDependencies<T extends Fn>(wrk: Work<T>): TaskTree<T>[] {
    if (isTreeBuilder(wrk)) { return wrk.getWorkTree().dependencies; }
    if (isTaskTree(wrk)) { return wrk.dependencies; }
    if (typeof wrk === "function") { return []; }
    throw new Error(`Unexpected work type: ${ wrk }`);
}

const hasProp = <K extends PropertyKey>(val: object, prop: K): val is Record<K, unknown> => prop in val;
function taskName(task: Fn): string {
    if (hasProp(task, "taskName") && typeof task.taskName === "string" && task.taskName) { return task.taskName; }
    return task.name || task.toString() || "unknown";
}
const _traversePostVisit = (tree: TaskTree<Fn>, cb: (node: TaskTree<Fn>) => void, visited: Fn[]) => {
    if (tree.task && visited.includes(tree.task)) {
        const taskNames = [...visited, tree.task].map(taskName);
        const chainDescription = taskNames.some(t => t.includes("\n")) ? taskNames.join("\n↓\n") : taskNames.join(" -> ");

        const message = `
            Circular dependency.
            While tasks trees with circular dependency could be executed since each task is invoked once,
            this implies the dependency tree is incorrect. Please check the task chain:
        `.replace(/\n\s*\n/g, "").replace(/\n\s*/g, "\n").trim();

        throw new Error(message + "\n" + chainDescription);
    }

    tree.dependencies.forEach(node => _traversePostVisit(node, cb, tree.task ? [...visited, tree.task] : visited));
    cb(tree);
};
const traversePostVisit = (tree: TaskTree<Fn>, cb: (node: TaskTree<Fn>) => void) => _traversePostVisit(tree, cb, []);

const exactlyOne = <T>(val: T[]): val is [T] => val.length === 1;
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
            })),
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
