import { work } from "../lib/work";
import { unitTests } from "./definitions/test";
import { typecheck } from "./definitions/typecheck";
import { exec } from "../lib/exec";
import { lint } from "./definitions/lint";

const allChecks = work(
    unitTests,
    typecheck,
    lint,
);

exec(allChecks, { coverage: true });
