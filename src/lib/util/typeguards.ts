import { UnionOmit } from "./types";

export function isNot<In, Out extends In>(guard: (val: In) => val is Out) { return <T extends In>(val: T | Out): val is T => !guard(val); }

export function objectKeys<T extends object>(obj: T) { return Object.keys(obj) as Array<Exclude<keyof T, undefined>>; }
export function typeKeys<T extends object = never>(val: { [P in keyof T]-?: null }): Array<keyof T> { return objectKeys(val); }
export function hasKey<T extends object, K extends PropertyKey>(val: T, key: K): val is T & Record<K, unknown> { return key in val; }

export function excludeKeys<All extends PropertyKey, Excl extends All>(all: ReadonlyArray<All>, exclude: ReadonlyArray<Excl>): Exclude<All, Excl>[] {
    const isExcluded = (val: All): val is Excl => exclude.includes(val as never);
    return all.filter(isNot(isExcluded)) as never;
}
export function omit<T extends object, K extends keyof T>(val: T, keys: ReadonlyArray<K>): UnionOmit<T, K> {
    return excludeKeys(objectKeys(val), keys as never).reduce((_agg, k) => {
        _agg[k] = val[k];
        return _agg;
    }, {} as UnionOmit<T, K>);
}

export const isNull = <T>(val: T | null): val is null => val === null;
export const isNotNull = isNot(isNull);

// istanbul ignore next — it is reasonable to not go inside this in tests
export function unreachable(val: never): never {
    throw new Error(`Reached an unexpected state with value: ${ val }`);
}
