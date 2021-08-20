import { Execution } from "./execution";
import { Task } from "./work_api";
import { terminateToStream } from "./terminate_to_stream";
import { pipe } from "./mapping/pipe";
import { createExecutor } from "./create_executor";
import { bufferBeforeStart } from "./mapping/mappers/buffer_before_start";
import { provideCmdOptions } from "./mapping/mappers/provideCmdOptions";
import { heartbeat } from "./mapping/mappers/heartbeat";
import { annotate } from "./mapping/mappers/annotate";
import { tag } from "./mapping/mappers/tag";

export const exec = createExecutor(
    <Input extends Record<string, unknown>>(task: Task<Input, Execution> & { taskName: string }) => pipe(task, provideCmdOptions, bufferBeforeStart, annotate, heartbeat, tag),
    execution => terminateToStream(execution, process.stdout),
);
