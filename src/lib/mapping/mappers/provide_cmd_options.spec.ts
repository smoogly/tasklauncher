import { setupCmdOptionsProvider } from "./provide_cmd_options";
import { SinonStub, stub } from "sinon";
import { CmdOptions } from "../../runners/cmd";
import { createTestTask } from "../../util/create_test_task";
import { expect } from "chai";

describe("Mappers / ProvideCmdOptions", () => {
    let options: CmdOptions;
    let optionsProvider: SinonStub<[], CmdOptions>;
    let optionsMapper: ReturnType<typeof setupCmdOptionsProvider>;

    beforeEach(async () => {
        options = { supportsColor: true };
        optionsProvider = stub<[], CmdOptions>().returns(options);
        optionsMapper = setupCmdOptionsProvider(optionsProvider);
    });

    it("Should provide the options", async () => {
        const task = createTestTask<{}>();
        const mapped = optionsMapper(task.task);
        mapped({});

        expect(task.task.calledOnce).to.equal(true);
        expect(task.task.calledWithExactly(options)).to.equal(true);
    });
});
