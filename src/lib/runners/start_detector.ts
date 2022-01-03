import { types } from "util";
import { StartDetector } from "./cmd";


export const resolveStart = (detectStart: StartDetector, output: Parameters<StartDetector>[0]): ReturnType<StartDetector> => {
    try {
        const res = detectStart(output);
        if (!types.isPromise(res)) {
            return Promise.reject(new Error("Return value is not a promise"));
        }

        return res;
    } catch (e) {
        return Promise.reject();
    }
};
