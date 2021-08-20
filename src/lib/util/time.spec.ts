import { expect } from "chai";
import { formatDuration } from "./time";

describe("Util / Time", () => {
    describe("formatDuration", () => {
        const checks: { duration: number, res: string }[] = [
            { duration: 0, res: "0ms" },
            { duration: 1, res: "1ms" },
            { duration: 100, res: "100ms" },
            { duration: 1000, res: "1s" },
            { duration: 1100, res: "1.1s" },
            { duration: 1101, res: "1.1s" },
            { duration: 2000, res: "2s" },
            { duration: 59000, res: "59s" },
            { duration: 59999, res: "59.9s" },
            { duration: 60 * 1000, res: "1m" },
            { duration: 60 * 1100, res: "1.1m" },
            { duration: 1000 * 60 * 60, res: "1h" },
            { duration: 1000 * 60 * 60 + 1, res: "1h" },
            { duration: 1000 * 60 * 60 * 2, res: "2h" },
            { duration: 1000 * 60 * 60 * 100, res: "100h" },
        ];

        checks.forEach(({ duration, res }) => {
            it(`Should return ${ res } given ${ duration }`, async () => {
                expect(formatDuration(duration)).to.equal(res);
            });
        });

        it("Should throw if duration is negative", async () => {
            expect(() => formatDuration(-1)).to.throw(/negative/i);
        });
    });
});
