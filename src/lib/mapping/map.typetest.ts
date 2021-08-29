import { map } from "./map";
import { testWork } from "../tree_builder.typetest";
import { Input, Output } from "../work_api";
import { Any, Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";

const mapped = map(testWork, x => (input: Input<typeof x> & { a: 1 }) => input);
Test.checks([
    Test.check<Any.Compute<Input<typeof mapped>>, Any.Compute<Input<typeof testWork> & { a: 1 }>, Pass>(),
    Test.check<Any.Compute<Output<typeof mapped>>, Any.Compute<Input<typeof testWork> & { a: 1 }>, Pass>(),
]);
