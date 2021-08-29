import { Any } from "ts-toolbelt";
import { Fn } from "../work_api";

// Pipe is left-to-right compose
export function pipe<A>(arg: A): Any.Compute<A>;
export function pipe<A, B>(arg: A, f1: (arg: A) => B): Any.Compute<B>;
export function pipe<A, B, C>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C): Any.Compute<C>;
export function pipe<A, B, C, D>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D): Any.Compute<D>;
export function pipe<A, B, C, D, E>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E): Any.Compute<E>;
export function pipe<A, B, C, D, E, F>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F): Any.Compute<F>;
export function pipe<A, B, C, D, E, F, G>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G): Any.Compute<G>;
export function pipe<A, B, C, D, E, F, G, H>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H): Any.Compute<H>;
export function pipe<A, B, C, D, E, F, G, H, I>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I): Any.Compute<I>;
export function pipe<A, B, C, D, E, F, G, H, I, J>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I, f9: (arg: I) => J): Any.Compute<J>;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(arg: A, f1: (arg: A) => B, f2: (arg: B) => C, f3: (arg: C) => D, f4: (arg: D) => E, f5: (arg: E) => F, f6: (arg: F) => G, f7: (arg: G) => H, f8: (arg: H) => I, f9: (arg: I) => J, f10: (arg: J) => K): Any.Compute<K>;
export function pipe(arg: any, ...mappers: Fn[]): Fn { // eslint-disable-line @typescript-eslint/no-explicit-any
    return mappers.reduce((acc, fn) => fn(acc), arg);
}
