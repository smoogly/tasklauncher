import { Input, Meta, Output, Task, Work, WorkType, WrappedTask } from "./work_api";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";


type TestInput1 = { input1: string };
type TestInput2 = { input2: string };
type TestOutput1 = { output1: number };
type TestOutput2 = { output2: number };
type TestMeta1 = { meta1: symbol };
type TestMeta2 = { meta2: symbol };
type NestedMeta1 = { meta3: symbol };
type NestedMeta2 = { meta4: symbol };
type InferredNestedMeta = { meta5: symbol };
type TestTask1 = Task<TestInput1, TestOutput1> & TestMeta1;
type TestTask2 = Task<TestInput2, TestOutput2> & TestMeta2;
type NestedTask1 = WrappedTask<TestTask1> & NestedMeta1;
type NestedTask2 = WrappedTask<TestTask2> & NestedMeta2;
type InferredNested = ((arg: TestInput1) => TestTask1) & InferredNestedMeta;

type TestWork = Work<TestTask1>;
type UnionWork = Work<TestTask1 | TestTask2>;

Test.checks([
    Test.check<Input<TestTask1>, TestInput1, Pass>(),
    Test.check<Output<TestTask1>, TestOutput1, Pass>(),
    Test.check<Meta<TestTask1>, TestMeta1, Pass>(),

    Test.check<Input<TestTask1 | TestTask2>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Meta<TestTask1 | TestTask2>, TestMeta1 | TestMeta2, Pass>(),
]);

Test.checks([
    Test.check<Input<NestedTask1>, TestInput1, Pass>(),
    Test.check<Input<NestedTask2>, TestInput2, Pass>(),
    Test.check<Input<InferredNested>, TestInput1, Pass>(),
    Test.check<Output<NestedTask1>, TestOutput1, Pass>(),
    Test.check<Output<NestedTask2>, TestOutput2, Pass>(),
    Test.check<Output<InferredNested>, TestOutput1, Pass>(),
    Test.check<Meta<NestedTask1>, NestedMeta1 | TestMeta1, Pass>(),
    Test.check<Meta<NestedTask2>, NestedMeta2 | TestMeta2, Pass>(),
    Test.check<Meta<InferredNested>, InferredNestedMeta | TestMeta1, Pass>(),

    Test.check<Input<NestedTask1 | NestedTask2>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Input<InferredNested | NestedTask2>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
]);

Test.checks([
    Test.check<WorkType<TestWork>, TestTask1, Pass>(),
    Test.check<WorkType<NestedTask1>, TestTask1, Pass>(),
    Test.check<WorkType<NestedTask2>, TestTask2, Pass>(),
    Test.check<WorkType<Work<NestedTask1>>, TestTask1, Pass>(),
    Test.check<WorkType<Work<NestedTask2>>, TestTask2, Pass>(),
    Test.check<WorkType<Work<InferredNested>>, TestTask1, Pass>(), // TODO: resolve the worktype for nested work
]);

Test.checks([
    Test.check<Input<TestWork>, TestInput1, Pass>(),
    Test.check<Output<TestWork>, TestOutput1, Pass>(),

    Test.check<Input<UnionWork>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Output<UnionWork>, TestOutput1 | TestOutput2, Pass>(),

    Test.check<Input<Work<NestedTask1>>, TestInput1, Pass>(),
    Test.check<Output<Work<NestedTask1>>, TestOutput1, Pass>(),
    Test.check<Meta<Work<NestedTask1>>, TestMeta1 | NestedMeta1, Pass>(),

    Test.check<Input<Work<InferredNested>>, TestInput1, Pass>(),
    Test.check<Output<Work<InferredNested>>, TestOutput1, Pass>(),
    Test.check<Meta<Work<InferredNested>>, TestMeta1 | InferredNestedMeta, Pass>(),

    Test.check<Input<Work<NestedTask1 | NestedTask2>>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Output<Work<NestedTask1 | NestedTask2>>, TestOutput1 | TestOutput2, Pass>(),
    Test.check<Meta<Work<NestedTask1 | NestedTask2>>, NestedMeta1 | TestMeta1 | NestedMeta2 | TestMeta2, Pass>(),

    Test.check<Input<Work<InferredNested | NestedTask2>>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
    Test.check<Output<Work<InferredNested | NestedTask2>>, TestOutput1 | TestOutput2, Pass>(),
    Test.check<Meta<Work<InferredNested | NestedTask2>>, InferredNestedMeta | TestMeta1 | NestedMeta2 | TestMeta2, Pass>(),

    Test.check<Meta<Work<WrappedTask<Task<1, 2>>>>, {}, Pass>(),
]);

Test.checks([
    Test.check<Input<Task<Input<TestWork>, unknown>>, Input<TestWork>, Pass>(),
    Test.check<Input<Task<Input<UnionWork>, unknown>>, Any.Compute<TestInput1 & TestInput2>, Pass>(),
]);
