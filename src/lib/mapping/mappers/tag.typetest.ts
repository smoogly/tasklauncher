import { ExecutableTask } from "../../execution";
import { map } from "../map";
import { tag } from "./tag";
import { Work } from "../../work_api";

map(1 as unknown as ExecutableTask & { taskName: string }, tag);
map(1 as unknown as Work<ExecutableTask & { taskName: string }>, tag);
