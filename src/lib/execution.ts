import * as Observable from "zen-observable";
import { Task } from "./work_api";
import { hasKey } from "./util/typeguards";
import { types } from "util";

export interface Execution {
    output: Observable<Buffer>,
    completed: Promise<void>,
    started: Promise<void>,
    kill(): void,
}

// Need the widest type to allow extending
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Executable = Task<any, Execution>;

export function isExecution(val: unknown): val is Execution {
    if (typeof val !== "object") { return false; }
    if (!val) { return false; }

    return !hasKey(val, "output") || !(val.output instanceof Observable) ? false
        : !hasKey(val, "kill") || typeof val.kill !== "function" ? false
        : !hasKey(val, "started") || !types.isPromise(val.started) ? false
        : !(!hasKey(val, "completed") || !types.isPromise(val.completed));
}
