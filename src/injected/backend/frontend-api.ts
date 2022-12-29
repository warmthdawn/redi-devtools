import { Disposable } from "@wendellhu/redi";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { DependencyData, InjectorData, InjectorTreeNode } from "~/common/types";

export class FrontendApi implements Disposable {
    private backendReady = false;
    dispose(): void {
        this.backendReady = false;
    }

    private send(message: any) {
        if(!this.backendReady) {
            console.log("Backend not ready, skipping message: ", message)
            return;
        }
        window.postMessage({
            [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
            payload: message,
            direction: "TO_BACKGROUND",
        })
    }

    public markBackendReady() {
        this.backendReady = true;
        window.postMessage({
            [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
            cmd: BridgeCommands.Core_BackendApiReady,
            direction: "TO_CONTENT",
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

    public sendAllInjectors(rootNodes: InjectorTreeNode[]) {
        this.sendToFrontend(BridgeCommands.B2F_AllInjectors, rootNodes);
    }

    public sendAllDependencies(dependencies: DependencyData[]) {
        this.sendToFrontend(BridgeCommands.B2F_AllDependencies, dependencies);
    }

}