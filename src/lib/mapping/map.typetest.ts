import { map } from "./map";
import { testWork } from "../tree_builder.typetest";
import { Input, Output, SimpleTask, Fn, Work } from "../work_api";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";

const mapped = map(testWork, x => (input: Input<typeof x> & { a: 1 }) => input);
Test.checks([
    Test.check<Any.Compute<Input<typeof mapped>>, Any.Compute<Input<typeof testWork> & { a: 1 }>, Pass>(),
    Test.check<Any.Compute<Output<typeof mapped>>, Any.Compute<Input<typeof testWork> & { a: 1 }>, Pass>(),
]);

const mapped1 = map(testWork, 1 as unknown as <T>(val: T) => T);
const mapped2 = map(1 as unknown as Work<SimpleTask<number, 2>>, 1 as unknown as <T extends Fn<number, number>>(val: T) => T);
const mapped3 = map(1 as unknown as SimpleTask<number, 2>, 1 as unknown as <T extends Fn<number, number>>(val: T) => T);

Test.checks([
    Test.check<Input<typeof mapped1>, Input<typeof testWork>, Pass>(),
    Test.check<Input<typeof mapped2>, number, Pass>(),
    Test.check<Input<typeof mapped3>, number, Pass>(),
]);
