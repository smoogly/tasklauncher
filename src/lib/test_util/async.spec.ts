import { deferred, Deferred } from "./async";
import { expect } from "chai";

describe("Util / async_utils", () => {
    describe("deferred", () => {
        let def: Deferred<number>;
        beforeEach(async () => {
            def = deferred<number>();
        });

        it("Should resolve the promise with the given value", async () => {
            const num = Math.random();
            def.resolve(num);
            expect(await def.promise).to.equal(num);
        });

        it("Should reject the promise with the given value", async () => {
            const err = new Error("Test error");
            def.reject(err);
            expect(await def.promise.catch(x => x)).to.equal(err);
        });

        it("Should return a running promise", async () => {
            expect(def.status).to.equal("running");
        });

        it("Should set promise status to resolved if it was resolved", async () => {
            def.resolve(1);
            await def.promise;
            expect(def.status).to.equal("resolved");
        });

        it("Should set promise status to rejected if it was rejected", async () => {
            def.reject(new Error("Test error"));
            await def.promise.catch(x => x);
            expect(def.status).to.equal("rejected");
        });
    });
});
