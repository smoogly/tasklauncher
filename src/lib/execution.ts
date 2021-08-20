import * as Observable from "zen-observable";

export interface Execution {
    output: Observable<Buffer>;
    completed: Promise<void>;
    started: Promise<void>;
    kill(): void;
}
