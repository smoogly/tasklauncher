import { parallelize } from "./parallelize";
import { Task, Work } from "./work_api";
import { Execution } from "./execution";
import { map } from "./mapping/map";
import { Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";

declare const task: Task<{ input: string }, Execution & { res: number }> & { meta: string };
parallelize(task);

declare const work: Work<typeof task>;
parallelize(work);

const fn = parallelize(map(work, x => Object.assign(x, { prop: "text" })));

// @ts-expect-error, expected an argument
fn();

// @ts-expect-error, missing input prop
fn({});

// @ts-expect-error, unknown prop
fn({ input: "asdf", unknownProp: false });

const result = fn({ input: "asdf" });
result.completed.then(stats => {
    if (stats === null || stats.stats === null) { return; }

    const statTask = stats.stats.task;
    type StatTask = typeof statTask;
    Test.checks([
        Test.check<StatTask["prop"], string, Pass>(),
        Test.check<StatTask["meta"], string, Pass>(),
    ]);

    const statOutput = stats.stats.output;
    type StatOutput = typeof statOutput;
    Test.checks([
        Test.check<StatOutput["res"], number, Pass>(),
    ]);
});
