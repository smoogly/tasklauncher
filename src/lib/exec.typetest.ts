import { exec } from "./exec";
import { Execution } from "./execution";
import { Task } from "./work_api";
import { cmd, CmdOptions } from "./runners/cmd";

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
