import { Any, Iteration, List } from "ts-toolbelt";
import { Default, ResolveIntersection } from "./util/types";

// Deliberate any: arguments are contravariant, need a wide type for general compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyInput = any;
export type AnyTask = (input: AnyInput) => unknown;

export type Fn<In, Out> = (input: In) => Out;
export type Task<In, Out> = (input: In) => Out | Work<Task<In, Out>>;

export type TaskTree<T extends AnyTask> = {
    task: T | null, // Null denotes no-op when all dependencies need to be executed with in parallel
    dependencies: TaskTree<T>[],
};

export type TreeBuilder<T extends AnyTask> = {
    getWorkTree(): TaskTree<T>,
    after<WorkItems extends Work<AnyTask>[]>(...work: WorkItems): TreeBuilder<T | WorkType<WorkItems[number]>>,
};

export type Work<T extends AnyTask> = T | TaskTree<T> | TreeBuilder<T>;
export type WorkType<T extends Work<AnyTask>> =
      T extends AnyTask ? T
    : T extends TaskTree<infer TT> ? TT
    : T extends TreeBuilder<infer TB> ? TB
    : never;

export type ResolutionDepthLimit = Iteration.IterationOf<7>; // TODO: can this be increased?

type ResolveInput<
    T extends AnyTask,
    Iter extends Iteration.Iteration,
    R_ extends ReturnType<T> = ReturnType<T>,
    InputArg_ = Parameters<T>[0],
> = R_ extends Work<AnyTask> ? [InputArg_, ...Resolve<"input", R_, Iter>] : [InputArg_];

type ResolveOutput<
    T extends AnyTask,
    Iter extends Iteration.Iteration,
    R_ extends ReturnType<T> = ReturnType<T>,
> = R_ extends Work<AnyTask> ? Resolve<"output", R_, Iter> : R_;

type TaskMeta<T extends AnyTask> = { [P in keyof T]: T[P] }; // Extract props, that aren't function executable itself
type MaybeTaskMeta<T extends AnyTask, M_ = TaskMeta<T>> = Any.Equals<M_, {}> extends 1 ? never : M_;
type ResolveMeta<
    T extends AnyTask,
    Iter extends Iteration.Iteration,
    R_ extends ReturnType<T> = ReturnType<T>,
> = R_ extends Work<AnyTask> ? (MaybeTaskMeta<T> | Resolve<"meta", R_, Iter>) : MaybeTaskMeta<T>;


interface ResolveByType<T extends AnyTask, Iter extends Iteration.Iteration> {
    "input": ResolveInput<T, Iter>,
    "output": ResolveOutput<T, Iter>,
    "meta": ResolveMeta<T, Iter>,
}
interface DefaultByType {
    "input": [],
    "output": never,
    "meta": never,
}

type Resolve<
    K extends keyof ResolveByType<AnyTask, ResolutionDepthLimit>,
    T extends Work<AnyTask>,
    Iter extends Iteration.Iteration,
> = {
    "proceed": ResolveByType<WorkType<T>, Iteration.Prev<Iter>>[K],
    "stop": DefaultByType[K],
}[Iteration.Pos<Iter> extends 0 ? "stop" : "proceed"];

type HandleInputDefaults<Inputs extends AnyInput[]> =
      Any.Equals<List.Length<Inputs>, 0> extends 1 ? never // No args
    : Any.Equals<Exclude<Inputs[number], void | undefined>, never> extends 1 ? void // Only void
    : Exclude<Inputs[number], void | undefined>; // Has other inputs except voids

export type Input<T extends Work<AnyTask>> = ResolveIntersection<HandleInputDefaults<Resolve<"input", T, ResolutionDepthLimit>>>;
export type Output<T extends Work<AnyTask>> = Resolve<"output", T, ResolutionDepthLimit>;
export type Meta<T extends Work<AnyTask>> = Default<Resolve<"meta", T, ResolutionDepthLimit>, never, {}>;
