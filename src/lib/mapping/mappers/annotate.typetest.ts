import { annotate } from "./annotate";
import { ExecutableTask } from "../../execution";
import { map } from "../map";
import { Work } from "../../work_api";

map(1 as unknown as ExecutableTask & { taskName: string }, annotate);
map(1 as unknown as Work<ExecutableTask & { taskName: string }>, annotate);
