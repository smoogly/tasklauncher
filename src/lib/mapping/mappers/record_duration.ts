import { ExecutableFn } from "../../execution";
import { Input, Meta, Output, Fn } from "../../work_api";
import { copyMeta } from "../../util/meta";


export type WithRecordedDuration<T extends ExecutableFn> = Fn<Input<T>, Output<T> & { duration: Promise<number | null> }> & Meta<T>;
export function recordDuration<T extends ExecutableFn>(task: T): WithRecordedDuration<T> {
    function withStats(input: Input<T>) {
        const start = Date.now();
        const execution = task(input);

        return {
            ...execution,
            duration: execution.completed.then(() => Date.now() - start).catch(() => null),
        };
    }

    return copyMeta(withStats, task) as WithRecordedDuration<T>;
}
