import { Disposable } from "@wendellhu/redi";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { DependencyData } from "~/common/types";

export class FrontendApi implements Disposable {
    dispose(): void {
        
    }

    private send(message: any) {
        window.postMessage({
            [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
            payload: message,
            direction: "TO_BACKGROUND",
        })
    }

    public sendToFrontend(cmd: BridgeCommands, data?: any) {
        this.send({
            cmd,
            data,
        })
    }

    public sendRefresh() {
        this.sendToFrontend(BridgeCommands.B2F_DoRefresh)
    }

    public sendDependencyAdd(data: DependencyData) {
        this.sendToFrontend(BridgeCommands.B2F_DependencyAdd, data);
    }


    public sendDependencyRemove(data: DependencyData) {
        this.sendToFrontend(BridgeCommands.B2F_DependencyRemove, data);
    }


}