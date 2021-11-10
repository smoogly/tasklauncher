import { AnyTask, Input, Meta, Output, Fn, WorkType, Task } from "../work_api";
import {
    Dep2Input, Dep2Output, NestedOuterInput,
    TargetInput, TargetOutput,
    testWork,
    TestWorkInput, TestWorkMeta,
    TestWorkOutput,
} from "../tree_builder.typetest";
import { pipe } from "./pipe";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";
import { UnionOmit } from "../util/types";


declare function identity<T extends AnyTask>(task: T): T;
declare function extra<T extends AnyTask>(task: T): Fn<Input<T> & { extraInput: string }, Output<T> & { extraOutput: string }> & Meta<T> & { extraMeta: string };
declare function omit<T extends AnyTask>(task: T): Fn<UnionOmit<Input<T>, "dep1Input">, UnionOmit<Output<T>, "dep1Output">> & UnionOmit<Meta<T>, "dep1Meta">;
declare function restricted<T extends Task<TestWorkInput, TestWorkOutput> & TestWorkMeta>(task: T): Fn<Input<T>, Output<T>> & Meta<T>;

declare const task: WorkType<typeof testWork>;
const piped = pipe(task, restricted, identity, extra, omit);

// @ts-expect-error — insufficient input data
piped({});

Test.checks([
    Test.check<Input<typeof piped>, Any.Compute<NestedOuterInput & TargetInput & Dep2Input & { extraInput: string }>, Pass>(),
    Test.check<Output<typeof piped>, Any.Compute<(TargetOutput | Dep2Output | {}) & { extraOutput: string }>, Pass>(),
]);
