import { noop } from "./noop";

type PromiseStatus = "running" | "resolved" | "rejected";
export interface Deferred<T> {
    resolve(val: T): void,
    reject(val?: Error): void,
    promise: Promise<T>,
    status: PromiseStatus,
}

export function promiseStatus(promise: Promise<unknown>) {
    let status: PromiseStatus = "running";
    promise.then(
        () => { status = "resolved"; },
        () => { status = "rejected"; },
    );

    return () => status;
}

export function deferred<T>(): Deferred<T> {
    let resolve: Deferred<T>["resolve"] = noop;
    let reject: Deferred<T>["reject"] = noop;
    const promise = new Promise<T>((res, rej) => {
       resolve = res;
       reject = rej;
    });
    const status = promiseStatus(promise);
    return { resolve, reject, promise, get status() { return status(); } };
}

export const delay = (delayMs: number) => new Promise(res => setTimeout(res, delayMs));
