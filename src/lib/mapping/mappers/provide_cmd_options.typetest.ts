import { provideCmdOptions } from "./provide_cmd_options";
import { Task } from "../../work_api";
import { CmdOptions } from "../../runners/cmd";

// @ts-expect-error — incorrect task input type
provideCmdOptions(1 as unknown as Task<1, 1>);

// No cmd options in input, type not affected
const mapped1 = provideCmdOptions(1 as unknown as Task<{}, 1>);
mapped1({});

// Cmd options removed
const mapped2 = provideCmdOptions(1 as unknown as Task<CmdOptions, 1>);
mapped2({});

const cmdOptionsKey: keyof CmdOptions = "supportsColor";
// @ts-expect-error — incompatible type of CmdOptions prop
provideCmdOptions(1 as unknown as Task<{ [cmdOptionsKey]: 1 }, 1>);

