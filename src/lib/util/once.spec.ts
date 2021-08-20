import { SinonStub, stub } from "sinon";
import { once } from "./once";
import { expect } from "chai";

describe("Util / Once", () => {
    let fn: SinonStub<[number, number | undefined], number>;
    let wrapped: (val: number, second?: number) => number;
    beforeEach(() => {
        fn = stub<[number, number | undefined], number>().returns(0);
        wrapped = once(fn);
    });

    it("Should call the function with given arguments", async () => {
        wrapped(1, 2);
        expect(fn.calledWithExactly(1, 2)).to.equal(true);
    });

    it("Should return the result of calling the function", async () => {
        const res = Math.random();
        fn.returns(res);
        expect(wrapped(1)).to.equal(res);
    });

    it("Should call the wrapped function once", async () => {
        for (let i = 0; i < 100; i++) { wrapped(i); }
        expect(fn.calledOnce).to.equal(true);
    });

    it("Should return the same result even if given different arguments", async () => {
        fn.onFirstCall().returns(1)
            .onSecondCall().returns(2);

        expect(wrapped(1)).to.equal(wrapped(2));
    });
});
