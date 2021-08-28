import { Stats, TaskExecutionStat } from "../parallelize";
import {
    calculateCriticalPath,
    criticalPath,
    CritPathExpectedTaskShape,
    depth,
    extractTaskDurations,
} from "./critical_path";
import { expect } from "chai";
import { createTestTask } from "../test_util/create_test_task";
import { map } from "../mapping/map";
import { recordDuration } from "../mapping/mappers/record_duration";

const getFn = (taskName: string) => Object.assign(map(createTestTask().task, recordDuration).task, { taskName });
const stat = (name: string, duration: number, ...dependencies: Stats<TaskExecutionStat<CritPathExpectedTaskShape>>[]): Stats<TaskExecutionStat<CritPathExpectedTaskShape>> => ({
    stats: {
        task: getFn(name),
        output: { duration: Promise.resolve(duration) },
    },
    dependencies,
});
describe("Critical Path", () => {
    describe("criticalPath", () => {
        let stats: Stats<TaskExecutionStat<CritPathExpectedTaskShape>>;
        it("Should return null if execution was a noop", async () => {
            stats = { stats: null, dependencies: [] };
            expect(await criticalPath(stats)).to.equal(null);
        });
        it("Should return null if all tasks of the execution ran in parallel", async () => {
            stats = {
                stats: null,
                dependencies: [
                    stat("a", 0),
                    stat("b", 1),
                    stat("c", 2),
                    stat("d", 3),
                ],
            };
            expect(await criticalPath(stats)).to.equal(null);
        });

        it("Should print the critical path of an execution", async () => {
            stats = stat("three", 300, stat("two", 20, stat("one", 1)));
            const critpath = await criticalPath(stats);
            if (critpath === null) { throw new Error("Unexpected null"); }

            expect(critpath.totalDuration).to.equal("321ms");
            expect(critpath.pathStr.split("\n").filter(x => x.trim().length > 0)).to.deep.equal([
                "  1.0ms one",
                " 20.0ms two",
                "300.0ms three",
            ]);
        });
    });

    describe("extractTaskDurations", () => {
        it("Should resolve task names and durations", async () => {
            const durations = await extractTaskDurations(
                stat(
                    "one", 300,
                    stat("two.one", 21, stat("two.one.one", 1)),
                    stat("two.two", 22, stat("two.two.one", 1)),
                ),
            );

            expect(durations).to.deep.equal({
                stats: { duration: 300, name: "one" },
                dependencies: [
                    {
                        stats: { duration: 21, name: "two.one" },
                        dependencies: [{ stats: { duration: 1, name: "two.one.one" }, dependencies: [] }],
                    },
                    {
                        stats: { duration: 22, name: "two.two" },
                        dependencies: [{ stats: { duration: 1, name: "two.two.one" }, dependencies: [] }],
                    },
                ],
            });
        });

        it("Should handle noop tasks", async () => {
            expect(await extractTaskDurations({ stats: null, dependencies: [] })).to.deep.equal({ stats: null, dependencies: [] });
        });
    });

    describe("depth", () => {
        it("Should return zero for noop stats", async () => {
            expect(depth({ stats: null, dependencies: [] })).to.equal(0);
        });

        it("Should return maximum tree depth", async () => {
            expect(depth(
                stat(
                    "one", 300,
                    stat("two.one", 21, stat("two.one.one", 1)),
                    stat("two.two", 22),
                ),
            )).to.equal(3);
        });

        it("Should exclude noop stats from calculation", async () => {
            const noopstat = (...dependencies: Stats<TaskExecutionStat<CritPathExpectedTaskShape>>[]): Stats<TaskExecutionStat<CritPathExpectedTaskShape>> => ({
                stats: null,
                dependencies,
            });

            expect(depth(
                stat(
                    "one", 300,
                    stat("two.one", 21, stat("two.one.one", 1)),
                    noopstat(noopstat(noopstat(noopstat(stat("two.two", 22))))),
                ),
            )).to.equal(3);
        });
    });

    describe("calculateCriticalPath", () => {
        const dur = (name: string, duration: number, ...dependencies: Stats<{ name: string, duration: number }>[]): Stats<{ name: string, duration: number }> => ({
            stats: { name, duration },
            dependencies,
        });
        const noopdur = (...dependencies: Stats<{ name: string, duration: number }>[]): Stats<{ name: string, duration: number }> => ({
            stats: null,
            dependencies,
        });

        it("Should return the longest path through the durations tree", async () => {
            expect(
                calculateCriticalPath(
                    noopdur(
                        dur(
                            "one", 300,
                            dur("two.one", 21, dur("two.one.one", 1)),
                            noopdur(noopdur(noopdur(noopdur(dur("two.two", 22))))),
                        ),
                        dur(
                            "long", 200,
                            dur("long2", 202),
                            dur("long3", 201),
                        ),
                    ),
                ),
            ).to.deep.equal([{ name: "long", duration: 200 }, { name: "long2", duration: 202 }]);
        });
    });
});
