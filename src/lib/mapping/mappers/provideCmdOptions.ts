import { CmdOptions } from "../../runners/cmd";
import { supportsColor } from "chalk";
import { Meta, Output, Task } from "../../work_api";
import { copyMeta } from "../../util/meta";
import { Any, Object } from "ts-toolbelt";

// `keyof any` is a correct usage to get a value of a generic key
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnionOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export function setupCmdOptionsProvider(getOptions: () => CmdOptions) {
    return function provideCmdOptions<I extends Object.Optional<CmdOptions>, T extends Task<I, unknown>>(
        task: Any.Cast<T, Task<I, unknown>>
    ): Task<UnionOmit<I, keyof CmdOptions>, Output<T>> & Meta<T> {
        const cmdOptionsProvider = (input: UnionOmit<I, keyof CmdOptions>) => {
            return task({ ...input, ...getOptions() } as unknown as I) as Output<T>;
        };

        // Types are hard, I'm not sure why is this type not assignable on it's own.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return copyMeta(cmdOptionsProvider, task) as any;
    }
}

const cmdOptions: CmdOptions = {
    supportsColor: Boolean(supportsColor),
};

// istanbul ignore next — trivial config injection
export const provideCmdOptions = setupCmdOptionsProvider(() => cmdOptions);
