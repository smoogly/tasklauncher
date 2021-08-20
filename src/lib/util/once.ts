export function once<Args extends any[], R>(fn: (...args: Args) => R): (...args: Args) => R {
    let res: R;
    let called = false;
    return (...args: Args) => {
        if (called) { return res; }
        called = true;
        return res = fn(...args);
    };
}
