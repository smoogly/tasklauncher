import { Executable } from "../../execution";
import { map } from "../map";
import { tag } from "./tag";
import { Work } from "../../work_api";

map(1 as unknown as Executable & { taskName: string }, tag);
map(1 as unknown as Work<Executable & { taskName: string }>, tag);
