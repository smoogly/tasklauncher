import { exec } from "./exec";
import { Execution } from "./execution";
import { Task, WrappedTask } from "./work_api";
import { cmd, CmdOptions } from "./runners/cmd";
import { work } from "./work";

declare const task: Task<{ a: 1 }, Execution> & { taskName: string };
exec(task, { a: 1 });

// @ts-expect-error, unknown property
exec(task, { a: 1, unknown: 1 });

// @ts-expect-error, insufficient input
exec(task, {});

// @ts-expect-error, expected input but haven't got any
exec(task);

declare const taskWithCmd: Task<CmdOptions, Execution> & { taskName: string };
exec(taskWithCmd, {});
exec(taskWithCmd);

declare const taskWithOptional: Task<{ opt?: string }, Execution> & { taskName: string };
exec(taskWithOptional, { opt: "str" });
exec(taskWithOptional, {});

// Cmd without options
exec(cmd("echo 1"));

declare const wrappedTask: WrappedTask<Task<CmdOptions, Execution> & { taskName: string }> & { taskName: string };
exec(wrappedTask, {});
exec(wrappedTask);
exec(work(wrappedTask), {});
exec(work(wrappedTask));

const tsk = Object.assign((input: { a: 1 } & CmdOptions) => cmd("whop" + input.a), { taskName: "name" });
// exec(work(tsk), { a: 1 }); // TODO: uncomment and fix types
exec(tsk, { a: 1 });

// TODO: uncomment and fix types -- input of a wrapper task is task input + wrapper input
// const tsk2 = Object.assign((input: { a: 1 }) => cmd("whop" + input.a), { taskName: "name" });
// exec(work(tsk2), { a: 1 });
// exec(tsk2, { a: 1 });
