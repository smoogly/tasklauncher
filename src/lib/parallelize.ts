import * as Observable from "zen-observable";
import { merge } from "zen-observable/extras";

import { getDependencies, getRootTask } from "./work";
import { Fn, Task, Work } from "./work_api";
import { Execution } from "./execution";
import { noop } from "./util/noop";


const infinitePromise = new Promise(noop);
function _parallelize<Input>(
    work: Work<Task<Input, Execution>>,
    executions: WeakMap<Fn, Execution>,
    isRoot: boolean,
): Task<Input, Execution> {
    const task = getRootTask(work);
    const dependencies = getDependencies(work).map(dep => _parallelize(dep, executions, false));

    return (input: Input): Execution => {
        const dependentExecutions = dependencies.map(dep => dep(input));

        const killedDependencies: Execution[] = [];
        const killDependency = (dependency: Execution) => {
            if (killedDependencies.includes(dependency)) { return; }
            killedDependencies.push(dependency);
            dependency.kill();
        };

        const killOtherDependencies = (dependency: Execution) => (err: unknown) => {
            dependentExecutions
                .filter(other => other !== dependency)
                .forEach(killDependency);

            throw err;
        };

        const dependenciesStarted = Promise.all(dependentExecutions.map(dep => dep.started.catch(killOtherDependencies(dep))));
        const dependenciesCompleted = Promise.all(dependentExecutions.map(dep => dep.completed.catch(killOtherDependencies(dep))));

        let killed = false;
        const targetExecution = dependenciesStarted.then(() => {
            if (!task || killed) { return null; }

            const cachedExecution = executions.get(task);
            if (cachedExecution) { return cachedExecution; }

            const execution = task(input);
            executions.set(task, {
                ...execution,

                // Output of the execution is handled within this call,
                // so cached execution shouldn't have any.
                output: Observable.of<Buffer>(),
            });
            return execution;
        });

        const targetStarted = targetExecution.then(e => e?.started);
        const targetCompleted = targetExecution.then(e => e?.completed);

        Promise.all([targetStarted, targetCompleted]).catch(noop).then(() => {
            if (!isRoot) { return; }
            dependentExecutions.forEach(killDependency);
        }).catch(noop);
        const completed = Promise.all([targetCompleted, ...dependentExecutions.map(dep => dep.completed)]).then(noop);
        const started = Promise.race([targetStarted, dependenciesCompleted.then(() => infinitePromise)]).then(noop);

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
        completed.catch(noop).then(() => {
            executionCompleted = true;
        }).catch(noop);

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

export function parallelize<Input>(work: Work<Task<Input, Execution>>): Task<Input, Execution> {
    return _parallelize(work, new WeakMap(), true);
}
