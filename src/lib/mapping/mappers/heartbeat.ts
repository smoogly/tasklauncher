import { Input } from "../../work_api";
import * as Observable from "zen-observable";
import { noop } from "../../util/noop";
import { copyMeta } from "../../util/meta";
import { formatDuration } from "../../util/time";
import { once } from "../../util/once";
import { Executable } from "../../execution";

export function setupHeartbeat(
    scheduleHeartbeat: (cb: () => void) => () => void,
    spellDuration: (durationMs: number) => string,
) {
    return function heartbeat<T extends Executable & { taskName: string }>(task: T): T {
        function withHeartbeat(input: Input<T>) {
            const start = Date.now();
            const execution = task(input);

            const output = new Observable<Buffer>(s => {
                const stop = once(scheduleHeartbeat(() => s.next(Buffer.from(`Still running ${ task.taskName } for ${ spellDuration(Date.now() - start) }\n`))));
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

export const HEARTBEAT_INTERVAL_MS = 1000 * 60;

// istanbul ignore next — trivial scheduling
const scheduleHeartbeat = (cb: () => void) => {
    const heartbeatTimer = setInterval(cb, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(heartbeatTimer);
};

export const heartbeat = setupHeartbeat(scheduleHeartbeat, formatDuration);
