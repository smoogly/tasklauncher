import { Fn, Input, TaskTree, Work, WrappedTask } from "../work_api";
import { getDependencies, getRootTask, isWork } from "../work";
import { copyMeta } from "../util/meta";

const mappingCancellationToken = Symbol("Exec mapping cancellation token");

function mapWithCache<T extends Fn, R extends Fn>(work: T, mapper: (task: T) => R, mapped: WeakMap<T | WrappedTask<T>, R>): TaskTree<R>;
function mapWithCache<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R, mapped: WeakMap<T | WrappedTask<T>, R>): TaskTree<R>;
function mapWithCache<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R, mapped: WeakMap<T | WrappedTask<T>, R>): TaskTree<R> {
    const task = getRootTask<T>(work);
    const dependencies = getDependencies(work).map(d => mapWithCache(d, mapper, mapped));

    if (!task) {
        return { task: null, dependencies };
    }

    const cached = mapped.get(task);
    if (cached) {
        return { task: cached, dependencies };
    }

    // Task might be the target task returning final result, or it might be a wrapped task returning more work.
    // Work returned from a wrapped task must be mapped itself.
    // We won't know what the return value is until the mapped task is executed at a later time.
    // So this implementation wraps the task in an intermediary function that resolves
    // whether return value must be wrapped or not.

    let furtherWork: Work<T>;
    const interceptor: T = ((input: Input<T>) => {
        const res = task(input);
        if (!isWork(res)) { return res; }

        furtherWork = res as never;
        throw mappingCancellationToken;
    }) as never;
    const mappedInterceptor = mapper(copyMeta(interceptor, task));

    const taskWrapper: R = ((input: Input<T>) => {
        try {
            // Invoke interceptor to populate `furtherWork`
            // If interceptor returns without cancellation, then there is no further work
            // and nothing else needs to be done
            return mappedInterceptor(input);
        } catch (e) {
            if (e !== mappingCancellationToken) {
                // cancellation token is expected, anything else should be re-thrown
                throw e;
            }
        }

        // Interceptor cancelled, more mapping is required
        return mapWithCache(furtherWork, mapper, mapped);
    }) as never;

    // Meta is copied from the original task directly passed through the mapper
    const mappedTask = copyMeta(taskWrapper, mappedInterceptor);
    mapped.set(task, mappedTask);
    return {
        task: mappedTask,
        dependencies,
    };
}

export function map<T extends Fn, R extends Fn>(work: T, mapper: (task: T) => R): TaskTree<R>;
export function map<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R): TaskTree<R>;
export function map<T extends Fn, R extends Fn>(work: Work<T>, mapper: (task: T) => R): TaskTree<R> {
    return mapWithCache(work, mapper, new WeakMap());
}
