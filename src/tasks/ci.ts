import { work, exec, cmd } from "../lib";
import { unitTests } from "./definitions/test";
import { build, typecheck } from "./definitions/typescript";
import { lint } from "./definitions/lint";
import { stubSuite } from "./definitions/stubs";

const buildTasks = work(cmd("cp package.json README.md build")).after(build).after(
    unitTests,
    typecheck,
    lint,
    stubSuite,
);

exec(buildTasks, { coverage: true });
