import { Task, Fn, Work } from "../../work_api";
import { provideTaskName } from "./provide_task_name";
import { map } from "../map";

provideTaskName(1 as unknown as Fn<1, 1>).taskName === "str";

map(1 as unknown as Task<{ a: 1 }, 1>, provideTaskName).task?.taskName === "str";
map(1 as unknown as Work<Task<string, 1>>, provideTaskName).task?.taskName === "str";
