import { Input, Task } from "../../work_api";
import { Execution } from "../../execution";
import * as Observable from "zen-observable";
import { noop } from "../../util/noop";
import { copyMeta } from "../../util/meta";
import { formatDuration } from "../../util/time";
import { once } from "../../util/once";

export function setupHeartbeat(
    scheduleHeartbeat: (cb: () => void) => () => void,
    spellDuration: (durationMs: number) => string,
) {
    return function heartbeat<T extends Task<any, Execution> & { taskName: string }>(task: T) {
        function withHeartbeat(input: Input<T>) {
            const start = Date.now();
            const execution = task(input);

            const output = new Observable<Buffer>(s => {
                const stop = once(scheduleHeartbeat(() => s.next(Buffer.from(`Still running ${ task.taskName } for ${ spellDuration(Date.now() - start) }`))));
                execution.output.subscribe(s);
                Promise.race([execution.started, execution.completed]).then(stop, stop).catch(noop);
            });

            return {
                ...execution,
                output,
            };
        }

        return copyMeta(withHeartbeat, task);
    };
}

// istanbul ignore next — trivial scheduling
const scheduleHeartbeat = (cb: () => void) => {
    const heartbeatTimer = setInterval(cb, 1000 * 60);
    return () => clearInterval(heartbeatTimer);
};

export const heartbeat = setupHeartbeat(scheduleHeartbeat, formatDuration)
