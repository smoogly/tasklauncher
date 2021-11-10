import { Input, Output, Fn } from "../work_api";
import { copyMeta } from "./meta";
import { Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";

type Target = Fn<{ targetIn: string }, { targetOut: string }> & { ownMeta: boolean };
type Source1 = Fn<{ input: string }, { output: number }> & { p1: string, conflict: number };
type Source2 = Fn<string, boolean> & { p2: boolean, conflict: string };

declare const target: Target;
declare const source1: Source1;
declare const source2: Source2;

const copy = copyMeta(target, source1, source2);
type Copy = typeof copy;

Test.checks([
    // Input and output of the target stay the same
    Test.check<Input<Copy>, Input<typeof target>, Pass>(),
    Test.check<Output<Copy>, Output<typeof target>, Pass>(),

    Test.check<Copy["p1"], Source1["p1"], Pass>(),
    Test.check<Copy["p2"], Source2["p2"], Pass>(),
    Test.check<Copy["conflict"], Source2["conflict"], Pass>(),
    Test.check<Copy["ownMeta"], Target["ownMeta"], Pass>(),
]);

copy(
    // @ts-expect-error, source input must not match
    1 as unknown as Input<Source1>,
);
copy(
    // @ts-expect-error, source input must not match
    1 as unknown as Input<Source2>,
);
