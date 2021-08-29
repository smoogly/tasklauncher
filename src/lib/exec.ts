import { Execution } from "./execution";
import { Task, Work } from "./work_api";
import { terminateToStream } from "./terminate_to_stream";
import { pipe } from "./mapping/pipe";
import { createExecutor, ExecutorInputArg } from "./create_executor";
import { bufferBeforeStart } from "./mapping/mappers/buffer_before_start";
import { provideCmdOptions } from "./mapping/mappers/provide_cmd_options";
import { heartbeat } from "./mapping/mappers/heartbeat";
import { annotate } from "./mapping/mappers/annotate";
import { tag } from "./mapping/mappers/tag";
import { recordDuration } from "./mapping/mappers/record_duration";
import { printCriticalPath } from "./print_critical_path";
import { ResolveIntersection, UnionOmit } from "./util/types";
import { CmdOptions } from "./runners/cmd";

type Bag = Record<string, unknown>;
export type DefaultTaskShape<TaskInput extends Bag> = Task<TaskInput, Execution> & { taskName: string };
export type DefaultInput<TaskInput extends Bag> = ResolveIntersection<UnionOmit<TaskInput, keyof CmdOptions>>;
export type DefaultMappedTask<TaskInput extends Bag> = Task<DefaultInput<TaskInput>, Execution & { duration: Promise<number | null> }> & { taskName: string };
export const defaultMapper = <TaskInput extends Bag>(task: DefaultTaskShape<TaskInput>): DefaultMappedTask<TaskInput> => pipe(
    task,
    provideCmdOptions, bufferBeforeStart,
    annotate, heartbeat, tag,
    recordDuration,
);

export type Exec = <Inp extends Bag>(work: Work<DefaultTaskShape<Inp>>, ...input: ExecutorInputArg<ResolveIntersection<DefaultInput<Inp>>>) => void;
export const exec: Exec = createExecutor(defaultMapper, execution => {
    terminateToStream(execution, process.stdout);
    printCriticalPath(execution, process.stdout);
});
