# Task launcher

Execute development tasks as fast as possible, all in one go.  
Fail as soon as possible.

Install with
```
npm i --save-dev tasklauncher
# or 
yarn add --dev tasklauncher
```


## Parallel

Suppose, your workflow is linting and testing.  
Typically, you might run `eslint && jest` like this
```
   Lint    Test
      ┝━━━►┝━━━━━━► All Done
```

Task Launcher will run
```
 Lint ┝━━━►───╮
Tests ┝━━━━━━►┤
              ╰ All done
```
```typescript
import { exec, work, cmd } from "tasklauncher"
exec(work(cmd("eslint"), cmd("jest")))
```

Linting and testing are independent tasks and can be run in parallel.
The workflow is complete when both tasks are complete.


## Honouring dependencies

Suppose, your workflow includes linting, unit/integration/e2e tests,
frontend build and deployment, where integration tests depend on
a database, e2e depends on both database and frontend build,
and deployment must run after all other tasks complete successfully.

Task Launcher will run
```
      Lint ┝━►───────────╮
Unit Tests ┝━━━━━►───────┤   
  Start DB ┝━━━►╮        │
   Integ. Tests ┝━━━━►───┤
            E2E ╰──┝━━━━►┤ 
  Build FE ┝━━━━━━►┴─────┤
                  Deploy ┝━━► All done
```
```typescript
import { exec, work, cmd } from "tasklauncher"
const lint = cmd("eslint")
const feBuild = cmd("webpack")
const db = cmd("docker-compose -f database.yml up")
const unitTests = cmd("jest *.spec.js")
const integrationTests = work(cmd("jest *.integration.js")).after(db)
const e2eTests = work(cmd("cypress")).after(db, feBuild)
const deploy = work(cmd("terraform")).after(
    lint, feBuild, unitTests,
    integrationTests, e2eTests,
)
exec(deploy)
```


## Background tasks

Task will have 3 lifecycle events during a successful execution:
`inited`, `started` and `completed`.
```
Inited ┝━━━━━━┯╍╍╍╍╍► Completed
           Started
```

Task is `inited` when it's time to start the execution.

For a typical task, like `cmd("echo Hello")`, both `started`
and `completed` happen at the same time. However, if you need
something to be _running_ while something else is executed,
it is useful to separate the two.

For example, you might want to have a database available
when the integration tests execute. Specifically, in that case
you'd want the database to be ready to accept connections.
Database ready state would be a `started` event.

Task Launcher will init the dependent task after
the dependency is `started`, and will issue a `kill` once
the dependent task `completes`.
```
       Started   Kill
DB ┝━━━━━━┯╍╍╍╍╍╍╍┯╍╍► DB shutdown, task completed
    Tests ┝━━━━━━►╯
```
```typescript
import { exec, work, cmd, detectLog } from "tasklauncher"
const test = cmd("jest")
const db = cmd(
    "docker-compose -f database.yml up",
    detectLog("Database accepting connections")
)
exec(work(test).after(db))
```

Another way to use task `start` events is to launch development environment,
e.g. webpack devserver, nodemon and database:
```typescript
import { exec, work, cmd, detectLog } from "tasklauncher"
const webpack = cmd(
    "webpack serve",
    detectLog("Webpack build finished")
)
const db = cmd(
    "docker-compose -f database.yml up",
    detectLog("Database accepting connections")
)
const nodemon = cmd(
    "nodemon ./src/index.js",
    detectLog("Server listening on port 8080")
)

// Start webpack, and start nodemon after the database is ready
const devenv = work(
    webpack,
    work(nodemon).after(db)
)
exec(devenv)
```

Since all tasks are running in background mode, no task will complete, and no dependencies will be terminated.
All tasks will run continuously until the execution itself is killed, e.g. via Ctrl-C or by closing the terminal.


## Failures

The execution is halted as soon as any of the tasks fail.
Any remaining tasks will be ignored.
Any running tasks will be killed.
Process will be terminated with exit code 1.

By default, any output of the running tasks is ignored,
and failed task output is logged.


## Anatomy of a task

Task is a function returning [a certain API](./src/lib/execution.ts): 
```typescript
export interface Execution {
    output: Observable<Buffer>,
    completed: Promise<void>,
    started: Promise<void>,
    kill(): void,
}
```

Task is `inited` by calling the function. It is considered `started`
and `completed` when the respective promises resolve.

`kill` hook is triggered when execution is halted
or all direct dependencies of the task have completed,
if the task itself hasn't terminated by that time.

`output` observable is used to track task logs.

Built-in `cmd` runner executes a command in a child process,
providing the `Execution` API, e.g.
```typescript
import { cmd } from "tasklauncher"
const wait = cmd("sleep 5")
const execution = wait({})
execution.kill()
execution.completed.then(console.log, console.log)
```


## Shared dependencies

Tasks are only executed once, no matter how many other tasks
might depend on it.

For the purpose of the Task Launcher, tasks are tracked
using javascript identity. If `t1 === t2`, functions are
considered one task, conversely `t1 !== t2` are different tasks.

> Important: `cmd("echo 1") !== cmd("echo 1")`
> — same command, but different tasks.

Correct way to define a common dependency is
```typescript
const common = cmd("echo Common")
exec(work(
    work(cmd("echo One task"), common),
    work(cmd("echo Another task"), common),
))
```


## Input arguments

All the tasks within given work are executed with the same argument.
Only a single plain javascript object is supported as a task input.

```typescript
import { exec, work, Execution } from "tasklauncher"
import * as Observable from "zen-observable"

const generateExecution = (log: string): Execution => ({
    output: Observable.of(log),
    started: Promise.resolve(),
    completed: Promise.resolve(),
    kill: () => void 0,
})

const task1 = ({ arg1 }: { arg1: string }) => generateExecution(arg1)
const task2 = ({ arg2 }: { arg2: string }) => generateExecution(arg2)

exec(work(task1, task2), { arg1: "Hello", arg2: "World" })
```


## Runtime configuration

Input parameters can be used to configure the work at runtime.
A task, rather than returning [an Execution API](./src/lib/execution.ts),
may instead return further work: another task, or an entire tree of tasks. 

This can be used, for example, to run test with or without coverage
```typescript
import { exec, cmd } from "tasklauncher"
const tests = ({ coverage }) => cmd(`jest --coverage=${ coverage }`)
exec(tests, { coverage: true })
```

or to configure dependencies based on params
```typescript
import { exec, cmd, work } from "tasklauncher"
const db = cmd("docker-compose -f database.yml up")
const tests = ({ skipDB }) => {
    const testCommand = cmd("jest")
    return skipDB ? testCommand : work(testCommand).after(db)
}

exec(tests, { skipDB: false })
```


## Typescript

Task Launcher supports typescript. For example, work input type is inferred from individual tasks.
```typescript
import { exec, work, cmd } from "tasklauncher"

const task1 = ({ arg1 }: { arg1: string }) => cmd(arg1)
const task2 = ({ arg2 }: { arg2: string }) => cmd(arg2)

// @ts-expect-error, arg2 is missing in the task input object
exec(work(task1, task2), { arg1: "Hello" })
```

The easiest way to execute your work scripts is by using `ts-node`
```shell
npx ts-node -T my_work.ts
```
