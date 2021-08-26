import { recordDuration } from "./record_duration";
import { Executable } from "../../execution";
import { Test } from "ts-toolbelt";
import { Pass } from "ts-toolbelt/out/Test";


const mapped = recordDuration(1 as unknown as Executable);
const duration = mapped(1).duration;
Test.checks([
    Test.check<typeof duration, Promise<number | null>, Pass>(),
]);
