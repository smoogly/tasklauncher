import { ParallelizedExecution } from "./parallelize";
import { Writable } from "stream";
import { noop } from "./util/noop";
import * as chalk from "chalk";
import { criticalPath, CritPathExpectedTaskShape } from "./critical_path/critical_path";

export function printCriticalPath(execution: ParallelizedExecution<CritPathExpectedTaskShape>, stream: Writable) {
    (async () => {
        const executionStats = await execution.completed.catch(noop);
        if (!executionStats) { return; }

        const critPath = await criticalPath(executionStats);
        if (!critPath) { return; }
        
        stream.write(`Critical path (${ critPath.totalDuration }): \n${ critPath.pathStr }\n\n`);
    })().catch(err => {
        stream.write(chalk.red(`Critical path calculation failed: ${ err }`) + "\n");
        process.exitCode = 1;
    });
}
