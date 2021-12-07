import { AnyTask, Input } from "../../work_api";
import { copyMeta } from "../../util/meta";
import { taskName } from "../../util/task_name";


export type WithTaskName<T extends AnyTask> = T & { taskName: string };
export type TaskNameProvider = <T extends AnyTask>(task: T) => WithTaskName<T>;
export function setupTaskNameProvider(getTaskName: (t: AnyTask) => string): TaskNameProvider {
    return function provideTaskName<T extends AnyTask>(task: T): WithTaskName<T> {
        const cpy = (input: Input<T>) => task(input);
        return Object.assign(copyMeta(cpy, task), { taskName: getTaskName(task) });
    };
}

// istanbul ignore next — trivial config injection
export const provideTaskName = setupTaskNameProvider(taskName);
