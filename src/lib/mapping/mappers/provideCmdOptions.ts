import { CmdOptions } from "../../runners/cmd";
import { supportsColor } from "chalk";
import { Meta, Output, Task } from "../../work_api";
import { copyMeta } from "../../util/meta";
import { Any, Object } from "ts-toolbelt";

type UnionOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export function setupCmdOptionsProvider(getOptions: () => CmdOptions) {
    return function provideCmdOptions<I extends Object.Optional<CmdOptions>, T extends Task<I, any>>(task: Any.Cast<T, Task<I, any>>): Task<UnionOmit<I, keyof CmdOptions>, Output<T>> & Meta<T> {
        const cmdOptionsProvider = (input: UnionOmit<I, keyof CmdOptions>): Output<T> => {
            return task({ ...input, ...getOptions() } as unknown as I);
        };

        return copyMeta(cmdOptionsProvider, task) as any;
    }
}

const cmdOptions: CmdOptions = {
    supportsColor: Boolean(supportsColor),
};

// istanbul ignore next — trivial config injection
export const provideCmdOptions = setupCmdOptionsProvider(() => cmdOptions);
