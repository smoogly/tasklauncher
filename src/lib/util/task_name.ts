import { AnyTask } from "../work_api";
import { hasKey } from "./typeguards";

export function taskName(task: AnyTask): string {
    if (hasKey(task, "taskName") && typeof task.taskName === "string" && task.taskName) { return task.taskName; }
    return task.name || task.toString() || "unknown";
}
