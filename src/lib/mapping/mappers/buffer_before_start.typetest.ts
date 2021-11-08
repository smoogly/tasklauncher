import { Executable } from "../../execution";
import { map } from "../map";
import { bufferBeforeStart } from "./buffer_before_start";
import { Work } from "../../work_api";

map(1 as unknown as Executable, bufferBeforeStart);
map(1 as unknown as Work<Executable>, bufferBeforeStart);
