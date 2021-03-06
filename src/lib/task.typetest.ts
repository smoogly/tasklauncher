import { Input, Meta, Output, Task, Work, WorkType, Fn, AnyTask, AnyInput } from "./work_api";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";


type TestInput1 = { input1: string };
type TestInput2 = { input2: string };
type TestOutput1 = { output1: number };
type TestOutput2 = { output2: number };
type TestMeta1 = { meta1: symbol };
type TestMeta2 = { meta2: symbol };
type NestedMeta = { meta5: symbol };
type TestTask1 = Fn<TestInput1, TestOutput1> & TestMeta1;
type TestTask2 = Fn<TestInput2, TestOutput2> & TestMeta2;
type NestedTask = ((arg: TestInput1) => TestTask1) & NestedMeta;

type TestWork = Work<TestTask1>;
type UnionWork = Work<TestTask1 | TestTask2>;

Test.checks([
    Test.check<Input<AnyTask>, AnyInput, Pass>(),
    Test.check<Output<AnyTask>, unknown, Pass>(),
    Test.check<Meta<AnyTask>, {}, Pass>(),
    Test.check<Input<Task<AnyInput, 1>>, AnyInput, Pass>(),
    Test.check<Output<Task<AnyInput, 1>>, 1, Pass>(),
    Test.check<Meta<Task<AnyInput, 1>>, {}, Pass>(),

    Test.check<Input<() => void>, void, Pass>(),
    Test.check<Output<() => void>, void, Pass>(),
    Test.check<Output<() => never>, never, Pass>(),

    Test.check<Input<() => (arg: 1) => void>, 1, Pass>(),
    Test.check<Output<() => void>, void, Pass>(),
    Test.check<Output<() => never>, never, Pass>(),

    Test.check<Input<TestTask1>, TestInput1, Pass>(),
    Test.check<Output<TestTask1>, TestOutput1, Pass>(),
    Test.check<Meta<TestTask1>, TestMeta1, Pass>(),

    Test.check<Input<TestTask1 | TestTask2>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Meta<TestTask1 | TestTask2>, TestMeta1 | TestMeta2, Pass>(),
]);

Test.checks([
    Test.check<Input<NestedTask>, TestInput1, Pass>(),
    Test.check<Output<NestedTask>, TestOutput1, Pass>(),
    Test.check<Meta<NestedTask>, NestedMeta | TestMeta1, Pass>(),
]);

Test.checks([
    Test.check<WorkType<TestWork>, TestTask1, Pass>(),
    Test.check<WorkType<NestedTask>, NestedTask, Pass>(),
    Test.check<WorkType<Work<NestedTask>>, NestedTask, Pass>(),
]);

Test.checks([
    Test.check<Input<TestWork>, TestInput1, Pass>(),
    Test.check<Output<TestWork>, TestOutput1, Pass>(),

    Test.check<Input<UnionWork>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Output<UnionWork>, TestOutput1 | TestOutput2, Pass>(),

    Test.check<Input<Work<NestedTask>>, TestInput1, Pass>(),
    Test.check<Output<Work<NestedTask>>, TestOutput1, Pass>(),
    Test.check<Meta<Work<NestedTask>>, TestMeta1 | NestedMeta, Pass>(),
]);

Test.checks([
    Test.check<Input<Fn<Input<TestWork>, unknown>>, Input<TestWork>, Pass>(),
    Test.check<Input<Fn<Input<UnionWork>, unknown>>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
]);
