import { Readable } from "stream";
import * as Observable from "zen-observable";
import { observableFromStream, observableStatus } from "./observable";
import { deferred } from "./async";
import { noop } from "./noop";
import { expect } from "chai";
import { SinonFakeTimers, useFakeTimers } from "sinon";

describe("Util / observable", () => {
    describe("observableFromStream", () => {
        let timers: SinonFakeTimers;
        let stream: Readable;
        let observable: Observable<Buffer>;
        let capturedOutput: string;
        let resolve: (val: string | Buffer | null) => void;
        let reject: (err?: Error) => void;
        let status: ReturnType<typeof observableStatus>;

        beforeEach(async () => {
            timers = useFakeTimers();

            let next = deferred();
            resolve = async val => {
                next.resolve(val);
                next = deferred();
                await timers.runAllAsync();
            };
            reject = async err => {
                next.reject(err);
                next = deferred();
                await timers.runAllAsync();
            };

            async function* generate() {
                while (true) {
                    const val = await next.promise;
                    if (val === null) { return; }
                    yield val;
                }
            }

            stream = Readable.from(generate());
            observable = observableFromStream(stream);
            status = observableStatus(observable);

            capturedOutput = "";
            observable.subscribe(
                next => capturedOutput += next.toString("utf8"),
                noop
            );
        });

        it("Should pipe the values from the stream", async () => {
            await resolve("a");
            await resolve(Buffer.from("b"));
            await resolve("c");
            expect(capturedOutput).to.equal("abc");
        });

        it("Should replay historical values for new subscriptions when stream is closed", async () => {
            await resolve("a");
            await resolve("b");
            await resolve("c");
            await resolve(null);

            let localOutput = "";
            observable.map(x => x.toString("utf8"))
                .reduce((a, b) => a + b)
                .subscribe(x => { localOutput = x; });

            await timers.runAllAsync();
            expect(localOutput).to.equal("abc");
        });

        it("Should replay historical values for new subscriptions when stream has errored", async () => {
            await resolve("a");
            await resolve("b");
            await resolve("c");
            await reject(new Error("err"));

            let localOutput = "";
            observable.map(x => x.toString("utf8"))
                .subscribe(x => { localOutput += x; }, noop);

            await timers.runAllAsync();
            expect(localOutput).to.equal("abc");
        });

        it("Should mark new subscriptions rejected when stream has errored", async () => {
            await reject(new Error("err"));
            const status = observableStatus(observable.map(x => x.toString("utf8")));
            await timers.runAllAsync();
            expect(status()).to.equal("rejected");
        });

        it("Should pass stream values to new subscriptions", async () => {
            let localOutput = "";
            observable.map(x => x.toString("utf8")).subscribe(x => { localOutput += x; });

            await resolve("val");
            await timers.runAllAsync();
            expect(localOutput).to.equal("val");
        });

        it("Should complete the observable when stream closes", async () => {
            await resolve(null);
            expect(status()).to.equal("completed");
        });

        it("Should mark the stream as rejected if stream errors", async () => {
            await reject(new Error("err"));
            expect(status()).to.equal("rejected");
        });
    });
});
