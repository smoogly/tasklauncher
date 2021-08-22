import { objectKeys } from "../../lib/util/typeguards";
import { cmd, CmdOptions } from "../../lib/runners/cmd";
import { Execution } from "../../lib/execution";

export const checkOnly = cmd("./src/tasks/definitions/util/check-only.sh");

export const defaultTestSpec = "'src/**/*.spec.ts'";
type UnitTestsParams = {
    coverage: boolean,
    spec?: string,
    bail?: boolean,
    debug?: boolean,
};
export const unitTests = Object.assign((opts: UnitTestsParams & CmdOptions): Execution => {
    const nycExcludes = [
        "**/*.spec.ts",
        "src/tasks/**",
    ];

    const coverageLimits = {
        branches: 100,
        statements: 100,
        functions: 100,
        lines: 100,
    };
    const limitsParams = !opts.spec || opts.spec === defaultTestSpec
        ? `--check-coverage ${ objectKeys(coverageLimits).map(t => `--${ t }=${ coverageLimits[t] }`).join(" ") }`
        : ""; // Ignore limits when spec is specified

    const nyc = `nyc -r=text -r=html ${ limitsParams } --include 'src/**' -e .ts --all ${ nycExcludes.map(excl => `--exclude '${ excl }'`).join(" ") }`;

    const mochaIncludes = [
        "ts-node/register/transpile-only",
    ];
    const mocha = `mocha -A ${ opts.bail ? "--bail" : "" } ${ opts.debug ? "--inspect=5252 --inspect-brk" : "" } -t 5000 ${ mochaIncludes.map(incl => `-r ${ incl }`).join(" ") } ${ opts.spec || defaultTestSpec }`;
    const command = `${ (opts.coverage ? nyc : "") } ${ mocha }`;

    return cmd(command)(opts); // TODO: better way to compose commands? This, for example, looses task metadata
}, { taskName: "mocha" });
