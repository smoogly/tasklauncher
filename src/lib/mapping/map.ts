import { AnyTask, Input, Meta, Output, ResolutionDepthLimit, TaskTree, Work, WorkType } from "../work_api";
import { getDependencies, getRootTask, isWork } from "../work";
import { copyMeta } from "../util/meta";
import { Iteration } from "ts-toolbelt";

const mappingCancellationToken = Symbol("Exec mapping cancellation token");

// TODO: looks like meta handling in the implementation does not match the below type
//       Implementation passes the meta of the last nested fn in the chain,
//       while type denotes a union of metas.
export type MapperInput<T extends AnyTask> = Meta<T> & ((input: Input<T>) => Output<T>);

type Tip<Mta, Inp, Outp> = Mta & ((inp: Inp) => Outp);
type MapTask<
    T extends AnyTask,
    Inp, Outp, Mta,
    Iter extends Iteration.Iteration,
    _R extends ReturnType<T> = ReturnType<T>,
> = _R extends Work<AnyTask> ? Mta & ((inp: Inp) => TaskTree<MapTaskRecurse<WorkType<_R>, Inp, Outp, Mta, Iter>>) : Tip<Mta, Inp, Outp>;
type MapTaskRecurse<
    T extends AnyTask,
    Inp, Outp, Mta,
    Iter extends Iteration.Iteration,
> = {
    "proceed": MapTask<T, Inp, Outp, Mta, Iteration.Prev<Iter>>,
    "stop": Tip<Mta, Inp, Outp>,
}[Iteration.Pos<Iter> extends 0 ? "stop" : "proceed"];
export type MapperOutput<T extends AnyTask, R extends AnyTask> = MapTask<T, Input<R>, Output<R>, Meta<R>, ResolutionDepthLimit>;

function mapWithCache<T extends AnyTask, R extends AnyTask>(work: T, mapper: (task: MapperInput<T>) => R, mapped: WeakMap<T, MapperOutput<T, R>>): TaskTree<MapperOutput<T, R>>;
function mapWithCache<T extends AnyTask, R extends AnyTask>(work: Work<T>, mapper: (task: MapperInput<T>) => R, mapped: WeakMap<T, MapperOutput<T, R>>): TaskTree<MapperOutput<T, R>>;
function mapWithCache<T extends AnyTask, R extends AnyTask>(work: Work<T>, mapper: (task: MapperInput<T>) => R, mapped: WeakMap<T, MapperOutput<T, R>>): TaskTree<MapperOutput<T, R>> {
    const task = getRootTask<T>(work);
    const dependencies = getDependencies(work).map(d => mapWithCache(d, mapper, mapped));

    if (!task) {
        return { task: null, dependencies };
    }

    const cached = mapped.get(task);
    if (cached) {
        return { task: cached, dependencies };
    }

    // Task might be the target task returning final result, or it might be a wrapper returning more work.
    // Work returned from a wrapper must be itself mapped.
    // We won't know what the return value is, until the mapped task is executed at a later time.
    // So this implementation wraps the task in an intermediary function that resolves
    // whether return value must be wrapped or not.

    let furtherWork: Work<T>;
    const interceptor: MapperInput<T> = ((input: Input<T>) => {
        const res = task(input);
        if (!isWork(res)) { return res; }

        furtherWork = res as never;
        throw mappingCancellationToken;
    }) as never;
    const mappedInterceptor = mapper(copyMeta(interceptor, task));

    const taskWrapper: MapperOutput<T, R> = ((input: Input<T>) => {
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

export function map<T extends AnyTask, R extends AnyTask>(work: T, mapper: (task: MapperInput<T>) => R): TaskTree<MapperOutput<T, R>>;
export function map<T extends AnyTask, R extends AnyTask>(work: Work<T>, mapper: (task: MapperInput<T>) => R): TaskTree<MapperOutput<T, R>>;
export function map<T extends AnyTask, R extends AnyTask>(work: Work<T>, mapper: (task: MapperInput<T>) => R): TaskTree<MapperOutput<T, R>> {
    return mapWithCache(work, mapper, new WeakMap());
}
