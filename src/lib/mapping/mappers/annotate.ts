import { Execution } from "../../execution";
import { Input, Task } from "../../work_api";
import { copyMeta } from "../../util/meta";
import * as Observable from "zen-observable";
import { noop } from "../../util/noop";
import * as chalk from "chalk";
import { delay } from "../../util/async";
import { formatDuration } from "../../util/time";

export function setupAnnotator(spellDuration: (durationMs: number) => string) {
    return function annotate<T extends Task<any, Execution> & { taskName: string }>(task: T) {
        function annotated(input: Input<T>) {
            const start = Date.now();
            const execution = task(input);

            const output = new Observable<Buffer>(s => {
                s.next(Buffer.from(`Running ${ task.taskName }\n`));
                execution.output.subscribe(next => s.next(next), noop, noop);

                let started = false;
                let completed = false;
                execution.completed.then(() => {
                    completed = true;
                    const message = `Completed ${ task.taskName }`;
                    const timedMessage = started ? message : `${ message } in ${ spellDuration(Date.now() - start) }`;
                    s.next(Buffer.from(chalk.green(timedMessage) + "\n"));
                    s.complete();
                }).catch(noop);

                execution.started
                    .then(() => delay(1))
                    .then(() => {
                        started = true;
                        if (completed) { return; }
                        const message = `Started ${ task.taskName } in ${ spellDuration(Date.now() - start) }`;
                        s.next(Buffer.from(chalk.green(message) + "\n"));
                    }).catch(noop);

                Promise.all([execution.started, execution.completed])
                    .catch(e => {
                        s.next(Buffer.from(chalk.red(`Failed ${ task.taskName }`) + "\n"));
                        s.error(e);
                    })
                    .catch(noop);
            });

            return {
                ...execution,
                output,
            };
        }

        return copyMeta(annotated, task);
    };
}

export const annotate = setupAnnotator(formatDuration);
