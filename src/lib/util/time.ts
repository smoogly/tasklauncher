const defaultUnit = "ms";
const durationUnits = new Map<number, string>([
    [1000 * 60 * 60, "h"],
    [1000 * 60, "m"],
    [1000, "s"],
]);

type Unit = { magnitude: number, unit: string, fixed?: number };
export function selectDurationUnit(n: number): Unit {
    for (const [magnitude, unit] of durationUnits) {
        if (n < magnitude) { continue; }
        return { magnitude, unit };
    }

    return { magnitude: 1, unit: defaultUnit };
}

export function formatDuration(n: number, unitDef?: Unit): string {
    if (n < 0) { throw new Error("Negative duration"); }

    const { unit, magnitude, fixed } = unitDef ?? selectDurationUnit(n);
    const floored = Math.floor((n / magnitude) * 10) / 10;
    return `${ fixed === undefined ? floored : floored.toFixed(fixed) }${ unit }`;
}

export function alignDurations(durations: ReadonlyArray<number>): (duration: number) => string {
    if (durations.length === 0) { throw new Error("Empty list of durations"); }

    const units = durations.map(selectDurationUnit);
    const largestUnit = { ...units.reduce((a, b) => a.magnitude > b.magnitude ? a : b), fixed: 1 };
    const formatted = durations.map(d => formatDuration(d, largestUnit));
    const longest = formatted.map(s => s.length).reduce((a, b) => Math.max(a, b));

    return n => {
        if (!durations.includes(n)) { throw new Error(`Given item was not in initial list: ${ n }`); }
        const str = formatDuration(n, largestUnit);
        return str.padStart(longest, " ");
    };
}
