import { Input } from "../../work_api";
import { copyMeta } from "../../util/meta";
import { md5 } from "../../util/md5";
import { ExecutableFn } from "../../execution";

const NEWLINE_RE = /\n(?!$)/g;
const ENDS_WITH_NEWLINE_RE = /\n$/;
export function setupTagger(getTag: (taskName: string) => string) {
    return function annotate<T extends ExecutableFn & { taskName: string }>(task: T): T {
        const tagStr = getTag(task.taskName);
        function tagged(input: Input<T>) {
            const execution = task(input);

            let shouldPrependTag = true;
            return {
                ...execution,
                output: execution.output.map<Buffer>(chunk => {
                    const chunkStr = chunk.toString("utf8");
                    if (chunkStr.length === 0) { return chunk; }

                    const res = Buffer.from(
                        (shouldPrependTag ? tagStr : "") +
                        chunkStr.replace(NEWLINE_RE, "\n" + tagStr),
                    );

                    // Prepend tag next time if this chunk ends with newline
                    shouldPrependTag = ENDS_WITH_NEWLINE_RE.test(chunkStr);
                    return res;
                }),
            };
        }

        return copyMeta(tagged, task);
    };
}

// istanbul ignore next — trivial invocation of md5
const hashTag = (str: string) => `${ md5(str).slice(0, 6).toUpperCase() }| `;
export const tag = setupTagger(hashTag);
