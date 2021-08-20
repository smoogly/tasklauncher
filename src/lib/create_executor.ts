import { Fn, Input, Work } from "./work_api";
import { map } from "./mapping/map";
import { parallelize } from "./parallelize";
import { Executable, Execution } from "./execution";

export function createExecutor<
    In extends Fn,
    Out extends Executable
>(
    mapper: (task: In) => Out,
    terminate: (result: Execution) => void,
) {
    return (work: Work<In>, input: Input<Out>) => {
        const task = parallelize(map(work, mapper));
        terminate(task(input));
    };
}
