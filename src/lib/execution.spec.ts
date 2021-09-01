import { expect } from "chai";
import { Execution, isExecution } from "./execution";
import { createTestTask } from "./test_util/create_test_task";
import { typeKeys } from "./util/typeguards";

describe("isExecution", () => {
    it("Should return true if given an execution", async () => {
        expect(isExecution(createTestTask().task())).to.equal(true);
    });

    typeKeys<Execution>({
        completed: null,
        started: null,
        output: null,
        kill: null,
    }).forEach(k => it(`Should return false if '${ k }' key is missing`, async () => {
        const execution = createTestTask().task();
        delete execution[k];

        expect(isExecution(execution)).to.equal(false);
    }));

    [null, undefined, "str", 1, false, true].forEach(val => it(`Should return false if given ${ JSON.stringify(val) }`, async () => {
        expect(isExecution(val)).to.equal(false);
    }));
});
