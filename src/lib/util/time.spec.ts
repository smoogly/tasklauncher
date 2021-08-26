import { expect } from "chai";
import { alignDurations, formatDuration } from "./time";


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

        it("Should use the provided unit if given", async () => {
            expect(formatDuration(100, { magnitude: 2, unit: "zzz" })).to.equal("50zzz");
        });

        it("Should use a fixed number format if unit requests it", async () => {
            expect(formatDuration(100, { magnitude: 1, unit: "x", fixed: 4 })).to.equal("100.0000x");
        });
    });

    describe("alignDurations", () => {
        it("Should format durations in largest unit", async () => {
            const align = alignDurations([1000, 1]);
            expect(align(1)).to.match(/\ds$/);
        });

        it("Should align the smaller item to the end of largest", async () => {
            const align = alignDurations([10, 1]);
            expect(align(1)).to.match(/^ /);
        });

        it("Should align mixed items", async () => {
            const align = alignDurations([10, 100, 1]);
            expect(align(100)).to.equal("100.0ms");
            expect(align(10)).to.equal(" 10.0ms");
            expect(align(1)).to.equal("  1.0ms");
        });

        it("Should throw if no durations given", async () => {
            expect(() => alignDurations([])).to.throw(/empty/i);
        });

        it("Should throw if given item was not presented in the initial list", async () => {
            const align = alignDurations([10, 100, 1]);
            expect(() => align(9999)).to.throw(/not in initial list/i);
        });
    });
});
