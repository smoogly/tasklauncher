export function objectKeys<T extends object>(obj: T) { return Object.keys(obj) as Array<Exclude<keyof T, undefined>>; }

// istanbul ignore next — it is reasonable to not go inside this in tests
export function unreachable(val: never): never {
    throw new Error(`Reached an unexpected state with value: ${ val }`);
}
