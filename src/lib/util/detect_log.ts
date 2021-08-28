import { StartDetector } from "../runners/cmd";
import { HEARTBEAT_INTERVAL_MS } from "../mapping/mappers/heartbeat";
import { formatDuration } from "./time";

type TriggerFn = (log: string) => boolean;
type DetectLogOptions = { timeout?: number };
const defaultOptions: Required<DetectLogOptions> = {
    timeout: HEARTBEAT_INTERVAL_MS - 1, // By default terminate just before first heartbeat
};

export function detectLog(trigger: string | RegExp | TriggerFn, opts: DetectLogOptions = defaultOptions): StartDetector {
    const triggerFn: TriggerFn = typeof trigger === "function" ? trigger
        : typeof trigger === "string" ? log => log.includes(trigger)
        : log => trigger.test(log);

    const bufs: Buffer[] = [];
    const hasTriggered = () => triggerFn(Buffer.concat(bufs).toString("utf8"));

    return output => new Promise((res, rej) => {
        const start = Date.now();

        let timeout: NodeJS.Timeout;
        if (opts.timeout && opts.timeout > 0) {
            timeout = setTimeout(() => rej(new Error(
                `Trigger not detected in ${ formatDuration(Date.now() - start) }: ${ trigger }`,
            )), opts.timeout);
        }

        const subscription = output.subscribe(
            next => {
                bufs.push(next);
                if (hasTriggered()) {
                    clearTimeout(timeout);
                    subscription.unsubscribe();
                    res();
                }
            },
            error => rej(error),
            () => rej(new Error(`Output completed, while trigger was not detected: ${ trigger }`)),
        );
    });
}
