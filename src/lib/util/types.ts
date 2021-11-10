import { Any, Union } from "ts-toolbelt";

export type UnionOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type ResolveIntersection_<T, Intersect_ = Union.IntersectOf<T>> = Any.Equals<T, Intersect_> extends 1 ? T : Any.Compute<Intersect_>;
export type ResolveIntersection<T> = ResolveIntersection_<T>;

export type Default<T, Check, Deflt> = Any.Equals<T, Check> extends 1 ? Deflt : T;
