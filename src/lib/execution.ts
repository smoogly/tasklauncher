import * as Observable from "zen-observable";
import { Task } from "./work_api";

export interface Execution {
    output: Observable<Buffer>,
    completed: Promise<void>,
    started: Promise<void>,
    kill(): void,
}

// Need the widest type to allow extending
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Executable = Task<any, Execution>;
