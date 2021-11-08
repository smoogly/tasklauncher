import { Any, Iteration } from "ts-toolbelt";
import { ResolveIntersection } from "./util/types";

// Deliberate any, arguments are contravariant, need a wide type for general compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fn = (arg: any) => unknown;
export type Task<In, Out> = (input: In) => Out;

export type TaskTree<T extends Fn> = {
    task: T | WrappedTask<T> | null, // Null denotes no-op
    dependencies: TaskTree<T>[],
};

export type TreeBuilder<T extends Fn> = {
    getWorkTree(): TaskTree<T>,
    after<WorkItems extends Work<Fn>[]>(...work: WorkItems): TreeBuilder<T | WorkType<WorkItems[number]>>,
};

type WorkNestingLimit = Iteration.IterationOf<5>;

type InputArg<T extends Fn> = Parameters<T>[0];
type WrappedTask_<T extends Fn, Iter extends Iteration.Iteration> = Task<InputArg<T>, Work_<T, Iter>> & unknown;
export type WrappedTask<T extends Fn> = WrappedTask_<T, WorkNestingLimit>;

type Work_<T extends Fn, Iter extends Iteration.Iteration> = {
    flat: T | TaskTree<T> | TreeBuilder<T>,
    deep: WrappedTask_<T, Iteration.Prev<Iter>>,
}[Iteration.Pos<Iter> extends 0 ? never : "flat" | "deep"];
export type Work<T extends Fn> = Work_<T, WorkNestingLimit>;

type UnwrapTask<T> = T extends WrappedTask<infer I> ? UnwrapTask<I> : T;
export type WorkType<T extends Work<Fn>> =
      T extends WrappedTask<Fn> ? UnwrapTask<T>
    : T extends Fn ? T
    : T extends TaskTree<infer TT> ? UnwrapTask<TT>
    : T extends TreeBuilder<infer TB> ? UnwrapTask<TB>
    : never;

// Input, Output and Meta first work with T as an Fn to avoid inferring types when task is given explicitly
type ResolveInput<T extends Work<Fn>> = T extends Task<infer I, infer _O> ? I
    : WorkType<T> extends Task<infer WI, infer _WO> ? WI
    : never;
export type Input<T extends Work<Fn>> = ResolveIntersection<ResolveInput<T>>;

export type Output<T extends Work<Fn>> =
      T extends WrappedTask<infer NF> ? Output<NF>
    : T extends Task<infer _I, infer O> ? O
    : WorkType<T> extends Task<infer _WI, infer WO> ? WO
    : never;

type TaskMeta<T extends Fn> = { [P in keyof T]: T[P] }; // Extract props, that aren't function executable itself
type MaybeTaskMeta<T extends Fn, M_ = TaskMeta<T>> = Any.Equals<M_, {}> extends 1 ? never : M_;
export type Meta<T extends Work<Fn>> =
      T extends WrappedTask<infer NF> ? MaybeTaskMeta<T> | TaskMeta<UnwrapTask<NF>>
    : T extends Fn ? TaskMeta<T>
    : TaskMeta<WorkType<T>>;
