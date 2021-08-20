import { Union } from "ts-toolbelt";

// Deliberate any, arguments are contravariant, need a wide type for general compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fn = (arg: any) => unknown;
export type Task<In, Out> = (input: In) => Out;

export type TaskTree<T extends Fn> = {
    task: T | null, // Null denotes no-op
    dependencies: TaskTree<T>[],
};

export type TreeBuilder<T extends Fn> = {
    getWorkTree(): TaskTree<T>,
    after<WorkItems extends Work<Fn>[]>(...work: WorkItems): TreeBuilder<T | WorkType<WorkItems[number]>>,
};

export type Work<T extends Fn> = T | TaskTree<T> | TreeBuilder<T>;
export type WorkType<T extends Work<Fn>> = T extends Fn ? T : T extends Work<infer F> ? F : never;

// Input, Output and Meta first work with T as an Fn to avoid inferring types when task is given explicitly
type ResolveInput<T extends Work<Fn>> = T extends Task<infer I, infer _O> ? I
    : WorkType<T> extends Task<infer WI, infer _WO> ? WI
    : never;
export type Input<T extends Work<Fn>> = Union.IntersectOf<ResolveInput<T>>;

export type Output<T extends Work<Fn>> = T extends Task<infer _I, infer O> ? O
    : WorkType<T> extends Task<infer _WI, infer WO> ? WO
    : never;

type TaskMeta<T extends Fn> = { [P in keyof T]: T[P] }; // Extract props, that aren't function executable itself
export type Meta<T extends Work<Fn>> = T extends Fn ? TaskMeta<T> : TaskMeta<WorkType<T>>;
