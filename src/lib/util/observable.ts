import * as Observable from "zen-observable";
import { Readable } from "stream";
import { unreachable } from "./typeguards";
import { noop } from "./noop";

type Subscription = ZenObservable.SubscriptionObserver<Buffer>;
const accumulate = (stream: Readable) => {
    const subscribers: Subscription[] = [];
    const history: Buffer[] = [];
    let error: unknown;
    let status: "running" | "closed" | "error" = "running";

    (async () => {
        for await (const chunk of stream) {
            const item = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
            history.push(item);
            subscribers.forEach(s => s.next(item));
        }
        subscribers.forEach(s => s.complete());
        status = "closed";
    })().catch(err => {
        subscribers.forEach(s => s.error(err));
        status = "error";
        error = err;
    });

    return (subscriber: Subscription) => {
        history.forEach(item => subscriber.next(item));

        switch (status) {
            case "running":
                subscribers.push(subscriber);
                return () => subscribers.splice(subscribers.indexOf(subscriber), 1);

            case "closed":
                subscriber.complete();
                return noop;

            case "error":
                subscriber.error(error);
                return noop;

            // istanbul ignore next
            default:
                return unreachable(status);
        }
    };
};
export function observableFromStream(stream: Readable) {
    const subscribe = accumulate(stream);
    return new Observable<Buffer>(observer => subscribe(observer));
}

export function observableStatus(observable: Observable<unknown>) {
    let status: 'idle' | 'running' | 'rejected' | 'completed' = 'idle';
    const set = (s: typeof status) => () => { status = s; };
    observable.subscribe(
        set('running'),
        set('rejected'),
        set('completed'),
    );

    return () => status;
}
