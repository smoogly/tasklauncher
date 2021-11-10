import { Writable } from "stream";
import { ParallelizedExecution } from "./parallelize";
import { AnyTask } from "./work_api";

export const terminateToStream = (execution: ParallelizedExecution<AnyTask>, stream: Writable) => {
    let lastErr: unknown = {};
    const logError = (err: unknown) => {
        if (err === lastErr) { return; }

        lastErr = err;
        const msg = err instanceof Error ? `${ err.message }\n${ err.stack }` : err;
        stream.write("\n" + msg + "\n");
        process.exitCode = 1;
    };

    execution.output.subscribe(
        chunk => stream.write(chunk),
        logError,
        () => stream.write("\n"),
    );

    Promise.all([execution.started, execution.completed]).catch(logError);
};
