import * as Observable from "zen-observable";
import { AnyInput, Task, Fn } from "./work_api";
import { hasKey } from "./util/typeguards";
import { types } from "util";

export interface Execution {
    output: Observable<Buffer>,
    completed: Promise<void>,
    started: Promise<void>,
    kill(): void,
}

export type ExecutableTask = Task<AnyInput, Execution>;
export type ExecutableFn = Fn<AnyInput, Execution>;
export function isExecution(val: unknown): val is Execution {
    if (typeof val !== "object") { return false; }
    if (!val) { return false; }

    return hasKey(val, "output") && val.output instanceof Observable
        && hasKey(val, "kill") && typeof val.kill === "function"
        && hasKey(val, "started") && types.isPromise(val.started)
        && hasKey(val, "completed") && types.isPromise(val.completed);
}
