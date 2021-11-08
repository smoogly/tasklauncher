import { annotate } from "./annotate";
import { Executable } from "../../execution";
import { map } from "../map";
import { Work } from "../../work_api";

map(1 as unknown as Executable & { taskName: string }, annotate);
map(1 as unknown as Work<Executable & { taskName: string }>, annotate);
