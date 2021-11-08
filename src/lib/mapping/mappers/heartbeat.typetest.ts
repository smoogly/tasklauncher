import { Executable } from "../../execution";
import { map } from "../map";
import { heartbeat } from "./heartbeat";
import { Work } from "../../work_api";

map(1 as unknown as Executable & { taskName: string }, heartbeat);
map(1 as unknown as Work<Executable & { taskName: string }>, heartbeat);
