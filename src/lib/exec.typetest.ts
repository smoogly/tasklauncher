import { exec } from "./exec";
import { Execution } from "./execution";
import { Task } from "./work_api";
import { CmdOptions } from "./runners/cmd";

declare const task: Task<{ a: 1 }, Execution> & { taskName: string };
exec(task, { a: 1 });

// @ts-expect-error, insufficient input
exec(task, {});

declare const taskWithCmd: Task<CmdOptions, Execution> & { taskName: string };
exec(taskWithCmd, {});
