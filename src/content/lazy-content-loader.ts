import browser from "webextension-polyfill";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { initContentBridge } from "./contentBridge";
import { injectBackend } from "./injectBackend";



let status = "unload";

const connection = browser.runtime.connect({
    name: "devtools-content-script",

});

console.log("[redi-dev] Loading bridge...");
connection.onMessage.addListener((message: any) => {
    if (message.cmd === BridgeCommands.Core_InjectFullBackend) {

        console.log("[redi-dev] Trying to inject backend...");
        if (status === "unload") {
            status = "loading";

            const callback = (e: MessageEvent) => {

                if (e.data && e.data[REDI_DEVTOOLS_MESSAGE_FLAG] && e.data.direction === "TO_CONTENT" && e.data.cmd === BridgeCommands.Core_BackendApiReady) {
                    window.removeEventListener("message", callback);
                    status = "loaded"
                    connection.postMessage({
                        cmd: BridgeCommands.B2F_BackendApiReady,
                    });
                    console.log("[redi-dev] Backend injected...");
                }
            }

            window.addEventListener("message", callback);

            initContentBridge(connection);
            injectBackend();

        } else if (status === "loaded") {
            connection.postMessage({
                cmd: BridgeCommands.B2F_BackendApiReady,
            });
            console.log("[redi-dev] The Backend has injected previously, skipped.");
        }
        //loading的时候不用管
    }

})

