import { Executable } from "../../execution";
import { Input, Meta, Output, Task } from "../../work_api";
import { copyMeta } from "../../util/meta";


export type WithRecordedDuration<T extends Executable> = Task<Input<T>, Output<T> & { duration: Promise<number | null> }> & Meta<T>;
export function recordDuration<T extends Executable>(task: T): WithRecordedDuration<T> {
    function withStats(input: Input<T>) {
        const start = Date.now();
        const execution = task(input);

        return {
            ...execution,
            duration: execution.completed.then(() => Date.now() - start).catch(() => null),
        };
    }

    return copyMeta(withStats, task) as ReturnType<typeof recordDuration>;
}
