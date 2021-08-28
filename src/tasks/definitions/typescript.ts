import { cmd } from "../../lib";

export const typecheck = cmd("tsc -p tsconfig.json --noEmit");
export const build = cmd("tsc -b tsconfig-lib-release.json");
