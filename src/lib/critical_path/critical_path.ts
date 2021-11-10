import { AnyInput, SimpleTask } from "../work_api";
import { Execution } from "../execution";
import { Stats, TaskExecutionStat } from "../parallelize";
import { alignDurations, formatDuration } from "../util/time";

export type CritPathExpectedTaskShape = SimpleTask<AnyInput, Execution & { duration: Promise<number | null> }> & { taskName: string };
export async function criticalPath(executionStats: Stats<TaskExecutionStat<CritPathExpectedTaskShape>>) {
    if (depth(executionStats) < 2) { return null; } // Ignore all-parallel task trees

    const path = calculateCriticalPath(await extractTaskDurations(executionStats));
    const totalDuration = formatDuration(path.reduce((tot, stat) => tot + stat.duration, 0));
    const align = alignDurations(path.map(({ duration }) => duration));
    const pathStr = path.reverse().map(({ name, duration }) => `${ align(duration) } ${ name }`).join("\n");

    return { totalDuration, pathStr };
}

type Durations = Stats<{ name: string, duration: number }>;
export async function extractTaskDurations(stats: Stats<TaskExecutionStat<CritPathExpectedTaskShape>>): Promise<Durations> {
    const [duration, dependencies] = await Promise.all([stats.stats?.output.duration, Promise.all(stats.dependencies.map(extractTaskDurations))]);
    return {
        stats: stats.stats && duration ? { name: stats.stats.task.taskName, duration } : null,
        dependencies,
    };
}

export function depth(stats: Stats<unknown>): number {
    const ownIncrement = stats.stats === null ? 0 : 1;
    return stats.dependencies.map(depth).reduce((a, b) => Math.max(a, b), 0) + ownIncrement;
}

export function calculateCriticalPath(stats: Durations): { name: string, duration: number }[] {
    const tail = !stats.dependencies.length ? [] : stats.dependencies
        .map(calculateCriticalPath)
        .map(path => ({ path, duration: path.reduce((tot, step) => tot + step.duration, 0) }))
        .reduce((a, b) => a.duration > b.duration ? a : b)
        .path;

    if (!stats.stats) { return tail; }
    return [stats.stats, ...tail];
}
