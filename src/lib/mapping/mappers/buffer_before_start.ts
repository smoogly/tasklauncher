import { Input, Task } from "../../work_api";
import { copyMeta } from "../../util/meta";
import * as Observable from "zen-observable";
import { merge } from "zen-observable/extras";
import { noop } from "../../util/noop";
import { Execution } from "../../execution";

const emptyBuffer = Buffer.from([]);
export function bufferBeforeStart<T extends Task<any, Execution>>(task: T): T {
    function bufferedBeforeStart(input: Input<T>) {
        const execution = task(input);

        const beforeStart = new Observable<Buffer>(s => {
            execution.output.subscribe(s);
            execution.started.then(() => s.complete()).catch(noop);
        }).reduce((a, b) => Buffer.concat([a, b]), emptyBuffer);

        const afterStart = new Observable<Buffer>(s => {
            execution.started.then(() => execution.output.subscribe(s)).catch(noop);
        });

        return {
            ...execution,
            output: merge(beforeStart, afterStart),
        };
    }

    return copyMeta(bufferedBeforeStart, task);
}
