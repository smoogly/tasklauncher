import { AnyTask } from "../work_api";
import { objectKeys } from "./typeguards";
import { List } from "ts-toolbelt";

type RawMeta<T> = { [P in keyof T]: T[P] };
type Reduce<Sources extends AnyTask[], Result> = {
    "proceed": Reduce<List.Tail<Sources>, Omit<Result, keyof List.Head<Sources>> & RawMeta<List.Head<Sources>>>,
    "stop": Result,
}[List.Length<Sources> extends 0 ? "stop" : "proceed"];
export function copyMeta<Target extends AnyTask, Sources extends AnyTask[]>(target: Target, ...sources: Sources) {
    sources.forEach(source => {
        objectKeys(source).forEach(key => {
            target[key] = source[key];
        });
    });

    return target as Target & Reduce<Sources, {}>;
}
