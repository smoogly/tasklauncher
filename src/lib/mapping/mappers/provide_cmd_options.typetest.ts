import { provideCmdOptions } from "./provide_cmd_options";
import { SimpleTask, Task, Fn, Work } from "../../work_api";
import { CmdOptions } from "../../runners/cmd";
import { map } from "../map";

// @ts-expect-error — incorrect task input type
provideCmdOptions(1 as unknown as Fn<1, 1>);

// No cmd options in input, type not affected
const mapped1 = provideCmdOptions(1 as unknown as Fn<{}, 1>);
mapped1({});

// Cmd options removed
const mapped2 = provideCmdOptions(1 as unknown as Fn<CmdOptions, 1>);
mapped2({});

const cmdOptionsKey: keyof CmdOptions = "supportsColor";
// @ts-expect-error — incompatible type of CmdOptions prop
provideCmdOptions(1 as unknown as Task<{ [cmdOptionsKey]: 1 }, 1>);

map(1 as unknown as SimpleTask<CmdOptions, 1>, provideCmdOptions);
map(1 as unknown as Work<SimpleTask<CmdOptions, 1>>, provideCmdOptions);

