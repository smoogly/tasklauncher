import { createTestTask, TestTask } from "../../lib/test_util/create_test_task";
import { work, copyMeta, AnyTask } from "../../lib";

const common = createTestTask<{}>();
const dep1 = createTestTask<{}>();
const dep2 = createTestTask<{}>();
const target = createTestTask<{}>();

const tag = <T extends AnyTask>(fn: T, taskName: string): T & { taskName: string } => Object.assign(fn, { taskName });
const control = <T>(task: TestTask<T>, startAfter: number, runTime?: number) => {
    function controlled(input: T) {
        const res = task.task(input);

        setTimeout(task.start.resolve, startAfter);
        if (runTime !== undefined) {
            setTimeout(task.completion.resolve, startAfter + runTime);
        }

        return { ...res, kill: task.completion.resolve };
    }

    return copyMeta(controlled, task.task);
};

export const stubSuite = work(tag(control(target, 0, 0), "stub.target"))
    .after(
        tag(control(dep1, 10, 10), "stub.intermediary.1"),
        tag(control(dep2, 3, 0), "stub.intermediary.2"),
    )
    .after(tag(control(common, 100), "stub.common"));
