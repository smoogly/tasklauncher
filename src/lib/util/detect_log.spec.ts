import { detectLog } from "./detect_log";
import * as Observable from "zen-observable";
import { observableFromStream } from "./observable";
import { createTestStream, TestStream } from "../test_util/create_test_stream";
import { SinonFakeTimers, useFakeTimers } from "sinon";
import { promiseStatus } from "../test_util/async";
import { expect } from "chai";

describe("Util / DetectLog", () => {
    let timers: SinonFakeTimers;
    let stream: TestStream<Buffer>;
    let observable: Observable<Buffer>;

    beforeEach(async () => {
        timers = useFakeTimers();
        stream = createTestStream<Buffer>(timers);
        observable = observableFromStream(stream.stream);
    });

    it("Should not resolve by default", async () => {
        const status = promiseStatus(detectLog("trigger", { timeout: 0 })(observable));
        await stream.write(Buffer.from("irrelevant"));
        expect(status()).to.equal("running");
    });

    it("Should resolve when trigger string is detected", async () => {
        const status = promiseStatus(detectLog("trigger", { timeout: 0 })(observable));
        await stream.write(Buffer.from("trigger"));
        expect(status()).to.equal("resolved");
    });

    it("Should resolve when trigger regexp is detected", async () => {
        const status = promiseStatus(detectLog(/trigger/i, { timeout: 0 })(observable));
        await stream.write(Buffer.from("TrIgGeR"));
        expect(status()).to.equal("resolved");
    });

    it("Should resolve when trigger function detects", async () => {
        const status = promiseStatus(detectLog(out => out.includes("trigger"), { timeout: 0 })(observable));
        await stream.write(Buffer.from("trigger"));
        expect(status()).to.equal("resolved");
    });

    it("Should resolve when trigger is emitted in separate chunks", async () => {
        const status = promiseStatus(detectLog("trigger", { timeout: 0 })(observable));
        await stream.write(Buffer.from("trig"));
        await stream.write(Buffer.from("ger"));
        expect(status()).to.equal("resolved");
    });

    it("Should reject if trigger is not detected quickly enough", async () => {
        const status = promiseStatus(detectLog("trigger")(observable));
        await timers.tickAsync(999999);
        expect(status()).to.equal("rejected");
    });

    it("Should reject if observable errors", async () => {
        const status = promiseStatus(detectLog("trigger", { timeout: 0 })(observable));
        await stream.raise(new Error("Observable has errored"));
        expect(status()).to.equal("rejected");
    });

    it("Should reject if observable completes while trigger is still not detected", async () => {
        const status = promiseStatus(detectLog("trigger", { timeout: 0 })(observable));
        await stream.terminate();
        expect(status()).to.equal("rejected");
    });
});
