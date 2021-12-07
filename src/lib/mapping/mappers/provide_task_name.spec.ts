import { SinonStub, stub } from "sinon";
import { AnyTask } from "../../work_api";
import { setupTaskNameProvider } from "./provide_task_name";
import { expect } from "chai";

describe("Mappers / ProvideTaskName", () => {
    let nameProvider: SinonStub<[AnyTask], string>;
    let nameMapper: ReturnType<typeof setupTaskNameProvider>;

    beforeEach(async () => {
        nameProvider = stub<[AnyTask], string>().returns("some task name");
        nameMapper = setupTaskNameProvider(nameProvider);
    });

    it("Should return a copy of a task", async () => {
        const ret = "ret";
        const task = stub<[string], string>().returns(ret);

        const mapped = nameMapper(task);
        expect(mapped).to.not.equal(task);

        expect(mapped("inp")).to.equal(ret);
        expect(task.calledWithExactly("inp")).to.equal(true);
    });

    it("Should set a name of the task", async () => {
        const mapped = nameMapper(() => void 0);
        expect(mapped).to.haveOwnProperty("taskName", "some task name");
    });
});
