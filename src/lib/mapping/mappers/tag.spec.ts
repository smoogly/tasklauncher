import { setupTagger } from "./tag";
import { SinonFakeTimers, SinonStub, stub, useFakeTimers } from "sinon";
import { createTestTask, TestTask } from "../../util/create_test_task";
import { Execution } from "../../execution";
import { expect } from "chai";
import { noop } from "../../util/noop";

describe("Mappers / Tag", () => {
    let getTag: SinonStub<[string], string>;
    let tagger: ReturnType<typeof setupTagger>;

    let taskName: string;
    let task: TestTask;
    let tagged: TestTask["task"];
    let taggedExecution: Execution;
    let capturedOutput: string;

    let timers: SinonFakeTimers;

    beforeEach(async () => {
        timers = useFakeTimers();

        getTag = stub<[string], string>().returns("tag ");
        tagger = setupTagger(getTag);

        task = createTestTask();
        taskName = "my test task";
        tagged = tagger(Object.assign(task.task, { taskName }));
        taggedExecution = tagged();

        capturedOutput = "";
        taggedExecution.output.subscribe(
            x => capturedOutput = capturedOutput + x.toString("utf8"),
            noop,
        );
        await timers.runAllAsync();
    });

    it("Should pipe the original output", async () => {
        const message = "Hello, World!";
        task.writeOutput(message);
        expect(capturedOutput).to.contain(message);
    });

    it("Should call the getTag with function name", async () => {
        expect(getTag.calledWithExactly(taskName)).to.equal(true);
    });

    it("Should prepend the output with the tag", async () => {
        task.writeOutput("str");
        expect(capturedOutput).to.equal("tag str");
    });

    it("Should add tags in multiline content", async () => {
        task.writeOutput("one\ntwo\nthree");
        expect(capturedOutput).to.equal("tag one\ntag two\ntag three");
    });

    it("Should not add a trailing tag if content with a newline", async () => {
        task.writeOutput("str\n");
        expect(capturedOutput).to.equal("tag str\n");
    });

    it("Should add a tag if content ended with newline and new output is given", async () => {
        task.writeOutput("one\n");
        task.writeOutput("two\n");
        task.writeOutput("three\n");
        expect(capturedOutput).to.equal("tag one\ntag two\ntag three\n");
    });

    it("Should handle consecutive newlines", async () => {
        task.writeOutput("\n");
        task.writeOutput("\n\n");
        task.writeOutput("\n\n\n");
        task.writeOutput("\n\n");
        task.writeOutput("\n");
        expect(capturedOutput).to.equal("tag \ntag \ntag \ntag \ntag \ntag \ntag \ntag \ntag \n");
    });

    it("Should not output tag if given an empty buffer", async () => {
        task.writeOutput("");
        expect(capturedOutput).to.equal("");
    });

    it("Should not put extra tags if single line is given over multiple chunks", async () => {
        task.writeOutput("Hello, ");
        task.writeOutput("World!");
        expect(capturedOutput).to.equal("tag Hello, World!");
    });
});
