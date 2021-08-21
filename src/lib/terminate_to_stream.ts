import { Execution } from "./execution";
import { Writable } from "stream";

export const terminateToStream = (execution: Execution, stream: Writable) => {
    let lastErr: unknown = {};
    const logError = (err: unknown) => {
        if (err === lastErr) { return; }

        lastErr = err;
        const msg = err instanceof Error ? `${ err.message }\n${ err.stack }` : err;
        stream.write("\n" + msg + "\n");
    };

    execution.output.subscribe(
        chunk => stream.write(chunk),
        logError,
        () => stream.write("\n"),
    );

    Promise.all([execution.started, execution.completed]).catch(logError);
};
