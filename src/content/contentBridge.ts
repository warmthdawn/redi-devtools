
import browser from 'webextension-polyfill'
import { REDI_DEVTOOLS_MESSAGE_FLAG } from '~/common/bridge';
import { BridgeCommands } from '~/common/consts';


export function initContentBridge(port: browser.Runtime.Port) {
    port.onMessage.addListener((message: any) => {
        if (!(typeof message.cmd === "string") || (message.cmd as string).startsWith("b2f:")) {
            return;
        }
    
        // 传给 injected script
    
    
        window.postMessage({
            [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
            payload: message,
            direction: "TO_PAGE",
        });
    })
    
    
    window.addEventListener("message", e => {
        if (e.source !== window) {
            return;
        }
    
        if (!e.data || !e.data[REDI_DEVTOOLS_MESSAGE_FLAG]) {
            return;
        }
    
        if (e.data.direction === "TO_PAGE" || e.data.direction === "TO_CONTENT") {
            return;
        }
    
    
        port.postMessage(e.data.payload);
    
    })
}
