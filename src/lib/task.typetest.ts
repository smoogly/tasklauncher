import { Input, Output, Task, Work, WorkType } from "./work_api";
import { Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";


type TestInput1 = { input1: string };
type TestInput2 = { input2: string };
type TestOutput1 = { output1: number };
type TestOutput2 = { output2: number };
type TestTask1 = Task<TestInput1, TestOutput1>;
type TestTask2 = Task<TestInput2, TestOutput2>;

type TestWork = Work<TestTask1>;
type UnionWork = Work<TestTask1 | TestTask2>;
Test.checks([
    Test.check<Input<TestTask1>, TestInput1, Pass>(),
    Test.check<Output<TestTask1>, TestOutput1, Pass>(),

    Test.check<Input<TestTask1 | TestTask2>, TestInput1 & TestInput2, Pass>(),
]);

Test.checks([
    Test.check<WorkType<TestWork>, TestTask1, Pass>(),
]);

Test.checks([
    Test.check<Input<TestWork>, TestInput1, Pass>(),
    Test.check<Output<TestWork>, TestOutput1, Pass>(),

    Test.check<Input<UnionWork>, TestInput1 & TestInput2, Pass>(),
    Test.check<Output<UnionWork>, TestOutput1 | TestOutput2, Pass>(),
]);
