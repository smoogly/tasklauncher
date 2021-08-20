import { Fn, TaskTree, Work } from "../work_api";
import { getDependencies, getRootTask } from "../work";

function mapWithCache<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R, mapped: WeakMap<T, R>): TaskTree<R> {
    const task = getRootTask(work);
    let mappedTask: R | null = null;
    if (task) {
        const cachedMapping = mapped.get(task);
        if (cachedMapping) {
            mappedTask = cachedMapping;
        } else {
            mappedTask = mapper(task);
            mapped.set(task, mappedTask);
        }
    }

    return {
        task: mappedTask,
        dependencies: getDependencies(work).map(d => mapWithCache(d, mapper, mapped)),
    };
}

export function map<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R): TaskTree<R> {
    return mapWithCache(work, mapper, new WeakMap());
}
