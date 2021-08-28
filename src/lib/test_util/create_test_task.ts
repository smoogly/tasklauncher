// istanbul ignore file — test utility

import { Deferred, deferred } from "./async";
import { SinonStub, stub } from "sinon";
import { Execution } from "../execution";
import * as Observable from "zen-observable";

export interface TestTask<T = void> {
    task: SinonStub<[T], Execution>,
    kill: SinonStub<[], void>,
    start: Deferred<void>,
    completion: Deferred<void>,
    writeOutput: (output: string) => void,
}
export const createTestTask = <T = void>(): TestTask<T> => {
    const start = deferred<void>();
    const completion = deferred<void>();

    const kill = stub<[], void>();
    let writeOutput: (output: string) => void = () => { throw new Error("Writer not initiated yet"); };

    const task = stub<[T], Execution>().returns({
        kill,
        started: start.promise,
        completed: completion.promise,
        output: new Observable<Buffer>(s => {
            Promise.all([completion.promise, start.promise]).catch(err => s.error(err));
            completion.promise.then(() => s.complete());
            writeOutput = output => s.next(Buffer.from(output));
        }),
    });

    return {
        task,
        kill,
        start,
        completion,
        get writeOutput() { return writeOutput; },
    };
};
