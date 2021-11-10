import { ExecutableTask } from "../../execution";
import { map } from "../map";
import { heartbeat } from "./heartbeat";
import { Work } from "../../work_api";

map(1 as unknown as ExecutableTask & { taskName: string }, heartbeat);
map(1 as unknown as Work<ExecutableTask & { taskName: string }>, heartbeat);
