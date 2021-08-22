import * as Observable from "zen-observable";
import { observableFromStream, observableStatus } from "./observable";
import { noop } from "./noop";
import { expect } from "chai";
import { SinonFakeTimers, useFakeTimers } from "sinon";
import { createTestStream, TestStream } from "./create_test_stream";

describe("Util / observable", () => {
    describe("observableFromStream", () => {
        let timers: SinonFakeTimers;
        let stream: TestStream<Buffer | string>;
        let observable: Observable<Buffer>;
        let capturedOutput: string;
        let status: ReturnType<typeof observableStatus>;

        beforeEach(async () => {
            timers = useFakeTimers();
            stream = createTestStream(timers);
            observable = observableFromStream(stream.stream);
            status = observableStatus(observable);

            capturedOutput = "";
            observable.subscribe(
                next => capturedOutput += next.toString("utf8"),
                noop,
            );
        });

        it("Should pipe the values from the stream", async () => {
            await stream.write("a");
            await stream.write(Buffer.from("b"));
            await stream.write("c");
            expect(capturedOutput).to.equal("abc");
        });

        it("Should replay historical values for new subscriptions when stream is closed", async () => {
            await stream.write("a");
            await stream.write("b");
            await stream.write("c");
            await stream.terminate();

            let localOutput = "";
            observable.map(x => x.toString("utf8"))
                .reduce((a, b) => a + b)
                .subscribe(x => { localOutput = x; });

            await timers.runAllAsync();
            expect(localOutput).to.equal("abc");
        });

        it("Should replay historical values for new subscriptions when stream has errored", async () => {
            await stream.write("a");
            await stream.write("b");
            await stream.write("c");
            await stream.raise(new Error("err"));

            let localOutput = "";
            observable.map(x => x.toString("utf8"))
                .subscribe(x => { localOutput += x; }, noop);

            await timers.runAllAsync();
            expect(localOutput).to.equal("abc");
        });

        it("Should mark new subscriptions rejected when stream has errored", async () => {
            await stream.raise(new Error("err"));
            status = observableStatus(observable.map(x => x.toString("utf8")));
            await timers.runAllAsync();
            expect(status()).to.equal("rejected");
        });

        it("Should pass stream values to new subscriptions", async () => {
            let localOutput = "";
            observable.map(x => x.toString("utf8")).subscribe(x => { localOutput += x; });

            await stream.write("val");
            await timers.runAllAsync();
            expect(localOutput).to.equal("val");
        });

        it("Should complete the observable when stream closes", async () => {
            await stream.terminate();
            expect(status()).to.equal("completed");
        });

        it("Should mark the stream as rejected if stream errors", async () => {
            await stream.raise(new Error("err"));
            expect(status()).to.equal("rejected");
        });
    });
});
