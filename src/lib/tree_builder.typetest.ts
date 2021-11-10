import { Input, Output, Meta, Fn } from "./work_api";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";
import { work } from "./work";


export type TargetInput = { input: string };
export type TargetOutput = { output: number };
export type TargetMeta = { meta: boolean };

export type Dep1Input = { dep1Input: number };
export type Dep1Output = { dep1Output: string };
export type Dep1Meta = { dep1Meta: boolean };

export type Dep2Input = { dep2Input: number };
export type Dep2Output = { dep2Output: string };
export type Dep2Meta = { dep2Meta: boolean };

export type NestedOuterInput = { nestedInput: string };

declare const targetTask: Fn<TargetInput, TargetOutput> & TargetMeta;
declare const dependency1: Fn<Dep1Input, Dep1Output> & Dep1Meta;
declare const dependency2: Fn<Dep2Input, Dep2Output> & Dep2Meta;
declare const nestedTask: (input: NestedOuterInput) => typeof targetTask;

const parallel = work(targetTask, dependency1, dependency2);
Test.checks([
    Test.check<Input<typeof parallel>, Any.Compute<TargetInput & Dep1Input & Dep2Input>, Pass>(),   // Input intersection
    Test.check<Output<typeof parallel>, TargetOutput | Dep1Output | Dep2Output, Pass>(),            // Output union
    Test.check<Meta<typeof parallel>, TargetMeta | Dep1Meta | Dep2Meta, Pass>(),                    // Meta union
]);

const parallelWithWrappedTask = work(targetTask, dependency1, dependency2, nestedTask);
Test.checks([
    Test.check<Input<typeof parallelWithWrappedTask>, Any.Compute<NestedOuterInput & TargetInput & Dep1Input & Dep2Input>, Pass>(), // Input intersection
    Test.check<Output<typeof parallelWithWrappedTask>, TargetOutput | Dep1Output | Dep2Output, Pass>(),                             // Output union
    Test.check<Meta<typeof parallelWithWrappedTask>, TargetMeta | Dep1Meta | Dep2Meta | {}, Pass>(),                                // Meta union
]);

declare const inferredWrappedTask: TargetMeta & ((_arg: TargetInput) => (typeof targetTask));
const parallelWithInferredWrappedTask = work(targetTask, dependency1, dependency2, inferredWrappedTask);
Test.checks([
    Test.check<Input<typeof parallelWithInferredWrappedTask>, Any.Compute<TargetInput & Dep1Input & Dep2Input>, Pass>(),    // Input intersection
    Test.check<Output<typeof parallelWithInferredWrappedTask>, TargetOutput | Dep1Output | Dep2Output, Pass>(),             // Output union
    Test.check<Meta<typeof parallelWithInferredWrappedTask>, TargetMeta | Dep1Meta | Dep2Meta, Pass>(),                     // Meta union
]);

export const testWork = work(targetTask).after(dependency1, dependency2).after(nestedTask);


export type TestWorkOutput = TargetOutput | Dep1Output | Dep2Output;                                // Input intersection
export type TestWorkInput = Any.Compute<NestedOuterInput & TargetInput & Dep1Input & Dep2Input>;    // Output union
export type TestWorkMeta = TargetMeta | Dep1Meta | Dep2Meta | {};                                   // Meta union
Test.checks([
    Test.check<Input<typeof testWork>, TestWorkInput, Pass>(),
    Test.check<Output<typeof testWork>, TestWorkOutput, Pass>(),
    Test.check<Meta<typeof testWork>, TestWorkMeta, Pass>(),
]);

const testTree = testWork.getWorkTree();
Test.checks([
    Test.check<Input<typeof testTree>, TestWorkInput, Pass>(),      // Input intersection
    Test.check<Output<typeof testTree>, TestWorkOutput, Pass>(),    // Output union
    Test.check<Meta<typeof testTree>, TestWorkMeta, Pass>(),        // Meta union
]);

Test.checks([
    Test.check<Input<() => typeof testTree>, TestWorkInput, Pass>(),
    Test.check<Output<() => typeof testTree>, TestWorkOutput, Pass>(),
]);
