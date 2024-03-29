import { AnyTask, TaskTree, TreeBuilder, Work, WorkType } from "./work_api";
import { unreachable } from "./util/typeguards";
import { taskName } from "./util/task_name";

export function isTreeBuilder<T extends AnyTask>(wrk: Work<T>): wrk is TreeBuilder<T>;
export function isTreeBuilder(wrk: unknown): wrk is TreeBuilder<AnyTask>;
export function isTreeBuilder(wrk: unknown): wrk is TreeBuilder<AnyTask> {
    return Boolean(wrk) && typeof wrk === "object" && wrk !== null && "getWorkTree" in wrk;
}

export function isTaskTree<T extends AnyTask>(wrk: Work<T>): wrk is TaskTree<T>;
export function isTaskTree(wrk: unknown): wrk is TaskTree<AnyTask>;
export function isTaskTree(wrk: unknown): wrk is TaskTree<AnyTask> {
    return Boolean(wrk) && typeof wrk === "object" && wrk !== null && "task" in wrk;
}

export function isWork<T extends AnyTask>(val: Work<T>): val is Work<T>;
export function isWork(val: unknown): val is Work<AnyTask>;
export function isWork(val: unknown): val is Work<AnyTask> {
    return typeof val === "function" || isTaskTree(val) || isTreeBuilder(val);
}

export function getRootTask<T extends AnyTask>(wrk: Work<T>): T | null {
    if (isTreeBuilder(wrk)) { return getRootTask(wrk.getWorkTree()); }
    if (isTaskTree(wrk)) { return wrk.task; }
    if (typeof wrk === "function") { return wrk; }
    return unreachable(wrk, "Unexpected work type");
}
export function getDependencies<T extends AnyTask>(wrk: Work<T>): TaskTree<T>[] {
    if (isTreeBuilder(wrk)) { return wrk.getWorkTree().dependencies; }
    if (isTaskTree(wrk)) { return wrk.dependencies; }
    if (typeof wrk === "function") { return []; }
    return unreachable(wrk, "Unexpected work type");
}

const _transformDependencies = (tree: TaskTree<AnyTask>, cb: (node: TaskTree<AnyTask>[]) => TaskTree<AnyTask>[], visited: AnyTask[]): TaskTree<AnyTask> => {
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

    const deps = tree.dependencies.map(treeNode => _transformDependencies(treeNode, cb, tree.task ? [...visited, tree.task] : [...visited]));
    return {
        task: tree.task,
        dependencies: cb(deps),
    };
};
const transformDependencies = (tree: TaskTree<AnyTask>, cb: (node: TaskTree<AnyTask>[]) => TaskTree<AnyTask>[]) => _transformDependencies(tree, cb, []);

const exactlyOne = <T>(val: T[]): val is [T] => val.length === 1;
function _work(tasks: Work<AnyTask>[], dependencies: Work<AnyTask>[]): TreeBuilder<AnyTask> {
    const workTreeBase: TaskTree<AnyTask> = exactlyOne(tasks)
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


    let workTree: TaskTree<AnyTask> = workTreeBase;
    if (dependencies.length > 0) {
        const dependencyTree = _work(dependencies, []).getWorkTree();
        const resultingDependencies = dependencyTree.task === null
            ? dependencyTree.dependencies
            : [dependencyTree];

        // Push dependencies in the end of the work tree
        workTree = transformDependencies(workTreeBase, deps => {
            if (deps.length > 0) { return deps; }
            return resultingDependencies;
        });
    }

    // Check for circular dependencies
    transformDependencies(workTree, x => x);

    return {
        getWorkTree: () => workTree,
        after: (...items) => _work([workTree], items),
    };
}

export function work<WorkItems extends Work<AnyTask>[]>(...workItems: WorkItems): TreeBuilder<WorkType<WorkItems[number]>> {
    return _work(workItems, []) as TreeBuilder<WorkType<WorkItems[number]>>;
}
