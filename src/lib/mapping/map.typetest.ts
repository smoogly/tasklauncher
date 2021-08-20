import { map } from "./map";
import { testWork } from "../tree_builder.typetest";
import { Input, Output } from "../work_api";
import { Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";

const mapped = map(testWork, x => (input: Input<typeof x> & { a: 1 }) => input);
Test.checks([
    Test.check<Input<typeof mapped>, Input<typeof testWork> & { a: 1 }, Pass>(),
    Test.check<Output<typeof mapped>, Input<typeof testWork> & { a: 1 }, Pass>(),
]);
