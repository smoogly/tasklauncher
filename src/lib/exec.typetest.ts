import { exec } from "./exec";
import { Execution } from "./execution";
import { Fn } from "./work_api";
import { cmd, CmdOptions } from "./runners/cmd";
import { work } from "./work";

declare const task: Fn<{ a: 1 }, Execution>;
exec(task, { a: 1 });

// @ts-expect-error, unknown property
exec(task, { a: 1, unknown: 1 });

// @ts-expect-error, insufficient input
exec(task, {});

// @ts-expect-error, expected input but haven't got any
exec(task);

declare const taskWithCmd: Fn<CmdOptions, Execution>;
exec(taskWithCmd, {});
exec(taskWithCmd);

declare const taskWithOptional: Fn<{ opt?: string }, Execution>;
exec(taskWithOptional, { opt: "str" });
exec(taskWithOptional, {});

// Cmd without options
exec(cmd("echo 1"));

const tsk = (input: { a: 1 } & CmdOptions) => cmd("whop" + input.a);
exec(work(tsk), { a: 1 });
exec(tsk, { a: 1 });

const tsk2 = (input: { a: 1 }) => cmd("whop" + input.a);
exec(work(tsk2), { a: 1 });
exec(tsk2, { a: 1 });
