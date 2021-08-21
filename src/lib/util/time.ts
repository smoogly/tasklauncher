const durationUnits = new Map([
    [1000 * 60 * 60, "h"],
    [1000 * 60, "m"],
    [1000, "s"],
    [Infinity, ""],
]);

export function formatDuration(n: number): string {
    if (n < 0) { throw new Error("Negative duration"); }

    let unit = "ms";
    for (const [magnitude, possibleMarker] of durationUnits) {
        if (n < magnitude) { continue; }
        n = n / magnitude;
        unit = possibleMarker;
        break;
    }

    const floored = Math.floor(n * 10) / 10;
    return `${ floored }${ unit }`;
}
