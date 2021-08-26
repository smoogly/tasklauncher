import { Input } from "../../work_api";
import { copyMeta } from "../../util/meta";
import * as Observable from "zen-observable";
import { Executable } from "../../execution";
import { noop } from "../../util/noop";

export function bufferBeforeStart<T extends Executable>(task: T): T {
    function bufferedBeforeStart(input: Input<T>) {
        const execution = task(input);

        const buffered = new Observable<Buffer>(s => {
            let buffer: Buffer[] | null = [];

            const emitBuffered = <Params extends unknown[]>(cb?: (...val: Params) => void) => (...val: Params) => {
                const cb_ = cb || noop;
                if (buffer === null) { return cb_(...val); }
                buffer.forEach(x => s.next(x));
                buffer = null;
                cb_(...val);
            };

            execution.started.then(emitBuffered(), emitBuffered());
            execution.output.subscribe(
                next => buffer ? buffer.push(next) : s.next(next),
                emitBuffered(err => s.error(err)),
                emitBuffered(() => s.complete()),
            );
        });

        return {
            ...execution,
            output: buffered,
        };
    }

    return copyMeta(bufferedBeforeStart, task);
}
