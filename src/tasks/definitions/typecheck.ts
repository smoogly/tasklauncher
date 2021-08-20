import { cmd } from "../../lib/runners/cmd";

export const typecheck = cmd("tsc -p tsconfig.json --noEmit");
