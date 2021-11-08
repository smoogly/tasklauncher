import { inspect } from "util";
import * as Observable from "zen-observable";
import { merge } from "zen-observable/extras";

import { getDependencies, getRootTask, isWork } from "./work";
import { Fn, Output, Task, Work } from "./work_api";
import { Execution, isExecution } from "./execution";
import { noop } from "./util/noop";
import { UnionOmit } from "./util/types";
import { omit, typeKeys } from "./util/typeguards";


export type Stats<T> = {
    stats: T | null,
    dependencies: Stats<T>[],
};

export type TaskExecutionStat<T extends Fn> = {
    task: T,
    output: UnionOmit<Output<T>, keyof Execution>,
};

type OmitOwnKey<T, K extends keyof T> = Omit<T, K>;
export type ParallelizedExecution<T extends Fn> = OmitOwnKey<Execution, "completed"> & { completed: Promise<Stats<TaskExecutionStat<T>>> };

const executionKeys = typeKeys<Execution>({
    completed: null,
    started: null,
    output: null,
    kill: null,
});

const infinitePromise = new Promise(noop);
function _parallelize<In, Out extends Execution, Meta>(
    work: Work<Task<In, Out> & Meta>,
    executions: WeakMap<Fn, {
        execution: ParallelizedExecution<Task<In, Out> & Meta>,
        useCount: number,
    }>,
): Task<In, ParallelizedExecution<Task<In, Out> & Meta>> {
    type ThisTask = Task<In, Out> & Meta;
    type ThisExecution = ParallelizedExecution<ThisTask>;

    const task = getRootTask(work);
    const dependencies = getDependencies(work).map(dep => _parallelize(dep, executions));

    return (input: In): ThisExecution => {
        const dependentExecutions = dependencies.map(dep => dep(input));

        const killedDependencies: ThisExecution[] = [];
        const killDependency = (dependency: ThisExecution) => {
            if (killedDependencies.includes(dependency)) { return; }
            killedDependencies.push(dependency);
            dependency.kill();
        };

        const killOtherDependencies = (dependency: ThisExecution) => (err: unknown) => {
            dependentExecutions
                .filter(other => other !== dependency)
                .forEach(killDependency);

            throw err;
        };

        const dependenciesStarted = Promise.all(dependentExecutions.map(dep => dep.started.catch(killOtherDependencies(dep))));
        const dependenciesCompleted = Promise.all(dependentExecutions.map(dep => dep.completed.catch(killOtherDependencies(dep))));

        let killed = false;
        const targetExecution = dependenciesStarted.then((): ThisExecution | null => {
            if (!task || killed) { return null; }

            const cachedExecution = executions.get(task);
            if (cachedExecution) {
                cachedExecution.useCount += 1;
                return cachedExecution.execution;
            }

            const taskOutput = task(input);
            if (isWork(taskOutput)) {
                return _parallelize(taskOutput as Work<ThisTask>, executions)(input);
            }

            if (!isExecution(taskOutput)) { throw new Error(`Expected task to return an execution object, instead got: ${ inspect(taskOutput) }`); }

            const originalKill = taskOutput.kill;
            const sharedKill = () => {
                if (cached.useCount > 1) {
                    cached.useCount--;
                    return;
                }

                originalKill.call(taskOutput);
            };

            const execution: ThisExecution = {
                ...taskOutput,
                kill: sharedKill,
                completed: taskOutput.completed.then(() => {
                    const ownStats: TaskExecutionStat<ThisTask> = {
                        task: task as ThisTask,
                        output: omit(taskOutput, executionKeys) as TaskExecutionStat<ThisTask>["output"],
                    };
                    return { stats: ownStats, dependencies: [] };
                }),
            };

            const cached = {
                execution: {
                    ...execution,

                    // Output of the execution is handled within this call,
                    // so cached execution shouldn't have any.
                    output: Observable.of<Buffer>(),
                },
                useCount: 1,
            };
            executions.set(task, cached);
            return execution;
        });

        const targetStarted = targetExecution.then(e => e?.started);
        const targetCompleted = targetExecution.then(e => e?.completed);

        Promise.all([targetStarted, targetCompleted]).catch(noop).then(() => {
            dependentExecutions.forEach(killDependency);
        }).catch(noop);

        const started = Promise.race([targetStarted, dependenciesCompleted.then(() => infinitePromise)]).then(noop);
        const completed = Promise.all([targetCompleted, dependenciesCompleted])
            .then(([stats, dependencyStats]): Stats<TaskExecutionStat<ThisTask>> => {
                if (!stats) { return { stats: null, dependencies: dependencyStats }; }
                return { ...stats, dependencies: dependencyStats };
            });

        const ownOutput = new Observable<Buffer>(s => {
            const handleError = (err: unknown) => {
                if (s.closed) { return; }
                s.error(err);
            };

            targetExecution
                .then(x => {
                    if (!x) { return s.complete(); }
                    x.output.subscribe(s);
                })
                .catch(handleError);

            completed.catch(handleError);
        });

        let executionCompleted = false;
        completed.catch(noop).then(() => { executionCompleted = true; }).catch(noop);

        return {
            kill: () => {
                if (killed || executionCompleted) { return; }

                killed = true;
                targetExecution.then(e => e?.kill()).catch(noop);
                dependentExecutions.forEach(killDependency);
            },
            output: merge(ownOutput, ...dependentExecutions.map(d => d.output)),
            started,
            completed,
        };
    };
}

export function parallelize<In, Out extends Execution, Meta>(work: Work<Task<In, Out> & Meta>): Task<In, ParallelizedExecution<Task<In, Out> & Meta>> {
    return _parallelize(work, new WeakMap());
}
