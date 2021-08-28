import { Input } from "../../work_api";
import { copyMeta } from "../../util/meta";
import * as Observable from "zen-observable";
import { noop } from "../../util/noop";
import * as chalk from "chalk";
import { delay } from "../../util/delay";
import { formatDuration } from "../../util/time";
import { Executable } from "../../execution";

export function setupAnnotator(spellDuration: (durationMs: number) => string) {
    return function annotate<T extends Executable & { taskName: string }>(task: T) {
        function annotated(input: Input<T>) {
            const start = Date.now();
            const execution = task(input);

            let onFailed: Promise<void> | null = null;
            let onStarted: Promise<void> | null = null;
            let onCompleted: Promise<void> | null = null;

            const started = execution.started
                .then(() => delay(1))
                .then(() => onStarted)
                .then(noop);

            const completed = execution.completed
                .then(() => delay(1))
                .then(() => Promise.all([started, onCompleted]))
                .then(noop)
                .catch(err => Promise.resolve(onFailed).then(() => Promise.reject(err)));

            const output = new Observable<Buffer>(s => {
                s.next(Buffer.from(`Running ${ task.taskName }\n`));
                execution.output.subscribe(next => s.next(next), noop, noop);

                let hasStarted = false;
                let hasCompleted = false;

                onCompleted = execution.completed
                    .then(() => {
                        hasCompleted = true;
                        const message = `Completed ${ task.taskName }`;
                        const timedMessage = hasStarted ? message : `${ message } in ${ spellDuration(Date.now() - start) }`;
                        s.next(Buffer.from(chalk.green(timedMessage) + "\n"));
                        s.complete();
                    })
                    .then(() => delay(1))
                    .then(noop, noop);

                onStarted = execution.started
                    .then(() => delay(1))
                    .then(() => {
                        hasStarted = true;
                        if (hasCompleted) { return; }
                        const message = `Started ${ task.taskName } in ${ spellDuration(Date.now() - start) }`;
                        s.next(Buffer.from(chalk.green(message) + "\n"));
                    })
                    .then(() => delay(1))
                    .then(noop, noop);

                onFailed = Promise.all([execution.started, execution.completed])
                    .catch(e => {
                        s.next(Buffer.from(chalk.red(`Failed ${ task.taskName }`) + "\n"));
                        s.error(e);
                    })
                    .then(() => delay(1))
                    .then(noop, noop);
            });

            return {
                ...execution,
                completed,
                started,
                output,
            };
        }

        return copyMeta(annotated, task);
    };
}

export const annotate = setupAnnotator(formatDuration);
