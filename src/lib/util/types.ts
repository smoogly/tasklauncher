import { Any, Union } from "ts-toolbelt";

export type UnionOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type ResolveIntersection<T> = Any.Equals<T, Union.IntersectOf<T>> extends 1 ? T : Any.Compute<Union.IntersectOf<T>>;
