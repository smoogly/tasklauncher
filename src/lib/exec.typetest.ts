import { exec } from "./exec";
import { Execution } from "./execution";
import { Fn } from "./work_api";
import { cmd, CmdOptions } from "./runners/cmd";
import { work } from "./work";

declare const task: Fn<{ a: 1 }, Execution> & { taskName: string };
exec(task, { a: 1 });

// @ts-expect-error, unknown property
exec(task, { a: 1, unknown: 1 });

// @ts-expect-error, insufficient input
exec(task, {});

// @ts-expect-error, expected input but haven't got any
exec(task);

declare const taskWithCmd: Fn<CmdOptions, Execution> & { taskName: string };
exec(taskWithCmd, {});
exec(taskWithCmd);

declare const taskWithOptional: Fn<{ opt?: string }, Execution> & { taskName: string };
exec(taskWithOptional, { opt: "str" });
exec(taskWithOptional, {});

// Cmd without options
exec(cmd("echo 1"));

const tsk = Object.assign((input: { a: 1 } & CmdOptions) => cmd("whop" + input.a), { taskName: "name" });
exec(work(tsk), { a: 1 });
exec(tsk, { a: 1 });

const tsk2 = Object.assign((input: { a: 1 }) => cmd("whop" + input.a), { taskName: "name" });
exec(work(tsk2), { a: 1 });
exec(tsk2, { a: 1 });
