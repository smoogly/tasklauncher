import { expect } from "chai";
import { md5 } from "./md5";

describe("Util / md5", () => {
    it("Should return md5 hash of a string", async () => {
        expect(md5("Hello, World!")).to.equal("65a8e27d8879283831b664bd8b7f0ad4");
    });
});
