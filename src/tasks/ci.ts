import { work } from "../lib/work";
import { checkOnly, unitTests } from "./definitions/test";
import { typecheck } from "./definitions/typecheck";
import { exec } from "../lib/exec";

const allChecks = work( // TODO: add lint
    checkOnly,
    unitTests,
    typecheck,
);

exec(allChecks, { coverage: true });
