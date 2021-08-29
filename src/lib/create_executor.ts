import { Fn, Input, Work } from "./work_api";
import { map } from "./mapping/map";
import { parallelize, ParallelizedExecution } from "./parallelize";
import { Executable } from "./execution";
import { Any, Object } from "ts-toolbelt";

export type IsEntirelyOptional<T> =
      Any.Equals<T, void> extends 1 ? 1
    : Any.Equals<T, never> extends 1 ? 1
    : T extends Record<string, unknown> ? Any.Equals<Omit<T, Object.OptionalKeys<T>>, {}> : 0;

export type ExecutorInputArg<T> = IsEntirelyOptional<T> extends 1 ? ([T] | []) : [T];
export function createExecutor<
    In extends Fn,
    Out extends Executable,
>(
    mapper: (task: In) => Out,
    terminate: (result: ParallelizedExecution<Out> ) => void,
) {
    return (work: Work<In>, ...input: ExecutorInputArg<Input<Out>>) => {
        const task = parallelize(map(work, mapper));
        terminate(task(input[0] ?? {}));
    };
}
