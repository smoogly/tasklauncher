import { CmdOptions } from "../../runners/cmd";
import { supportsColor } from "chalk";
import { Meta, Output, Fn, AnyTask, Input } from "../../work_api";
import { copyMeta } from "../../util/meta";
import { Any, Object } from "ts-toolbelt";


export type WithCmdOptions<T extends AnyTask> = Fn<Omit<Input<T>, keyof CmdOptions>, Output<T>> & Meta<T>;
export type Restriction<T extends AnyTask> = Input<T> extends Object.Optional<CmdOptions> ? T : never;

export type CmdOptionsProvider = <T extends AnyTask>(
    task: Any.Cast<T, Restriction<T>>
) => WithCmdOptions<T>;
export function setupCmdOptionsProvider(getOptions: () => CmdOptions): CmdOptionsProvider {
    return function provideCmdOptions<T extends AnyTask>(
        task: Any.Cast<T, Restriction<T>>,
    ): WithCmdOptions<T> {
        const cmdOptionsProvider = (input: Omit<Input<T>, keyof CmdOptions>) => {
            return task({ ...input, ...getOptions() });
        };

        // TODO: Types are hard, I'm not sure why is this type not assignable on it's own.
        return copyMeta(cmdOptionsProvider, task) as never;
    };
}

const cmdOptions: CmdOptions = {
    supportsColor: Boolean(supportsColor),
};

// istanbul ignore next — trivial config injection
export const provideCmdOptions = setupCmdOptionsProvider(() => cmdOptions);
