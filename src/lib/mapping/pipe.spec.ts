import { expect } from "chai";
import { SinonStub, stub } from "sinon";
import { pipe } from "./pipe";

describe("pipe", () => {
    it("Should apply given mappers in order", async () => {
        const m1 = stub<[1], 2>().returns(2);
        const m2 = stub<[2], 3>().returns(3);
        const m3 = stub<[3], 4>().returns(4);

        const result = pipe(1, m1, m2, m3);
        expect(result).to.equal(4);

        const cases: { fn: SinonStub, payload: number }[] = [
            { fn: m1, payload: 1 },
            { fn: m2, payload: 2 },
            { fn: m3, payload: 3 },
        ];
        for (const { fn, payload } of cases) {
            expect(fn.calledOnce).to.equal(true);
            expect(fn.calledWithExactly(payload)).to.equal(true);
        }
    });
});
