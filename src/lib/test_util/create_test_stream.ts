// istanbul ignore file — test utility

import { deferred } from "./async";
import { Readable } from "stream";
import { SinonFakeTimers } from "sinon";

export type TestStream<T> = {
    stream: Readable,
    terminate: () => Promise<void>,
    write: (val: T) => Promise<void>,
    raise: (err?: Error) => Promise<void>,
};
export function createTestStream<T = never>(timers: SinonFakeTimers): TestStream<T> {
    const terminateSymbol = Symbol("terminate");
    let nextValue = deferred<T | typeof terminateSymbol>();

    const write = async (val: T) => {
        nextValue.resolve(val);
        nextValue = deferred();
        await timers.runAllAsync();
    };
    const raise = async (err?: Error) => {
        nextValue.reject(err);
        nextValue = deferred();
        await timers.runAllAsync();
    };
    const terminate = async () => {
        nextValue.resolve(terminateSymbol);
        await timers.runAllAsync();
    };

    async function* generate() {
        while (true) {
            const val = await nextValue.promise;
            if (val === terminateSymbol) {
                return;
            }
            yield val;
        }
    }

    return {
        stream: Readable.from(generate()),
        terminate,
        write,
        raise,
    };
}
