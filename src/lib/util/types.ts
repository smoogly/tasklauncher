export type UnionOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
