import { Fn } from "../work_api";

// Pipe is left-to-right compose
export function pipe<A>(arg: A): A;
export function pipe<A, B>(arg: A, f1: (arg: A) => B): B;
export function pipe<A, B, C>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C): C;
export function pipe<A, B, C, D>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D): D;
export function pipe<A, B, C, D, E>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E): E;
export function pipe<A, B, C, D, E, F>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F): F;
export function pipe<A, B, C, D, E, F, G>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G): G;
export function pipe<A, B, C, D, E, F, G, H>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H): H;
export function pipe<A, B, C, D, E, F, G, H, I>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I, f9: (arg: I) => J): J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I, f9: (arg: I) => J, f10: (arg: J) => K): K;
export function pipe(arg: any, ...mappers: Fn[]): Fn {
    return mappers.reduce((acc, fn) => fn(acc), arg);
}
