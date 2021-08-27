import { work } from "../lib/work";
import { unitTests } from "./definitions/test";
import { typecheck } from "./definitions/typecheck";
import { exec } from "../lib/exec";
import { lint } from "./definitions/lint";
import { stubSuite } from "./definitions/stubs";

const allChecks = work(
    unitTests,
    typecheck,
    lint,
    stubSuite,
);

exec(allChecks, { coverage: true });
