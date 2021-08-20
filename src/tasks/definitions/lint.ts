import { cmd } from "../../lib/runners/cmd";

export const lint = cmd("eslint src --ext .ts --ignore-path .gitignore --max-warnings 0");
