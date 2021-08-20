import { Fn } from "../work_api";
import { objectKeys } from "./typeguards";
import { List } from "ts-toolbelt";

type Meta<T> = { [P in keyof T]: T[P] };
type Reduce<Sources extends Fn[], Result> = {
    "proceed": Reduce<List.Tail<Sources>, Omit<Result, keyof List.Head<Sources>> & Meta<List.Head<Sources>>>;
    "stop": Result;
}[List.Length<Sources> extends 0 ? "stop" : "proceed"];
export function copyMeta<Target extends Fn, Sources extends Fn[]>(target: Target, ...sources: Sources) {
    sources.forEach(source => {
        objectKeys(source).forEach(key => {
            target[key] = source[key];
        });
    });

    return target as Target & Reduce<Sources, {}>;
}
