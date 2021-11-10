import { pipe } from "./mapping/pipe";
import { bufferBeforeStart } from "./mapping/mappers/buffer_before_start";
import { provideCmdOptions } from "./mapping/mappers/provide_cmd_options";
import { heartbeat } from "./mapping/mappers/heartbeat";
import { annotate } from "./mapping/mappers/annotate";
import { tag } from "./mapping/mappers/tag";
import { recordDuration } from "./mapping/mappers/record_duration";
import { parallelize } from "./parallelize";
import { map } from "./mapping/map";
import { AnyTask, Input, Output, SimpleTask, Work } from "./work_api";
import { Execution } from "./execution";
import { printCriticalPath } from "./print_critical_path";
import { terminateToStream } from "./terminate_to_stream";
import { Any, Object } from "ts-toolbelt";

export type IsEntirelyOptional<T> =
      Any.Equals<T, void> extends 1 ? 1
    : Any.Equals<T, never> extends 1 ? 1
    : T extends Record<string, unknown> ? Any.Equals<Omit<T, Object.OptionalKeys<T>>, {}> : 0;
export type ExecutorInputArg<T> = IsEntirelyOptional<T> extends 1 ? ([T] | []) : [T];

type Bag = Record<string, unknown>;
type TaskRestriction<T extends AnyTask> = Input<T> extends Bag ? (Output<T> extends Execution ? T : never) : never;
type RestrictedTask = Work<SimpleTask<Bag, Execution> & { taskName: string }>; // This type must match what `T` is restricted to inside `TaskRestriction`

export function exec<T extends AnyTask>(work: Work<Any.Cast<T, TaskRestriction<T>> & { taskName: string }>, ...input: ExecutorInputArg<Input<T>>) {
    const wrk = work as unknown as RestrictedTask; // De-facto, `TaskRestriction` narrows `T` to this type
    const mapped = map(wrk, t => pipe(
        t,
        provideCmdOptions, bufferBeforeStart,
        annotate, heartbeat, tag,
        recordDuration,
    ));

    const task = parallelize(mapped);

    const execution = task(input[0] ?? {});
    terminateToStream(execution, process.stdout);
    printCriticalPath(execution, process.stdout);
}
