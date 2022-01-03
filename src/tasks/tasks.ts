import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { work, exec, cmd } from "../lib";
import { unitTests } from "./definitions/test";
import { build, typecheck } from "./definitions/typescript";
import { lint } from "./definitions/lint";
import { stubSuite } from "./definitions/stubs";

const test = work(
    unitTests,
    typecheck,
    lint,
    stubSuite,
);

const buildTasks = work(cmd("cp package.json README.md build")).after(build).after(test);

yargs(hideBin(process.argv))
    .command(
        "test", "Execute the test suite",
        opts => opts
            .option("coverage", {
                description: "Whether the coverage should be collected during test run",
                type: "boolean",
                default: true,
            }),
        argv => exec(test, argv),
    )
    .command(
        "build", "Build the package",
        () => exec(buildTasks, { coverage: true }),
    )
    .strictCommands()
    .strictOptions()
    .demandCommand(1, "Specify a command to execute")
    .scriptName("npm run task")
    .parse();
