import { Disposable, Inject } from "@wendellhu/redi";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { BridgeCommand, DependencyData, InjectorResponse, InjectorTreeNode } from "~/common/types";
import { InjectorNode } from "~/frontend/components/injector-tree";
import { DependencyService } from "./dependency-service";
import { DependencyProvider, InjectorProvider } from "./hook-service";
import { InjectorService } from "./injector-service";


export class BackendApi implements Disposable {


    constructor(
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
        @Inject(DependencyProvider) private dependencyProvider: DependencyProvider,
        @Inject(DependencyService) private dependencyService: DependencyService,
        @Inject(InjectorService) private injectorService: InjectorService,
    ) {

    }



    getDependencies(): DependencyData[] {
        return this.dependencyService.getDependencyNodes();
    }

    getInjectors(): InjectorTreeNode[] {
        return this.injectorService.getInjectorTree();
    }



    private onMessage(message: any) {
        if (message.cmd === BridgeCommands.F2B_GetDependencies) {
            const dependencies = this.getDependencies();
            this.reply({
                cmd: BridgeCommands.B2F_AllDependencies,
                data: dependencies,
            })
            return;
        }

        if(message.cmd === BridgeCommands.F2B_GetInjectors) {
            const injectors = this.getInjectors();

            this.reply({
                cmd: BridgeCommands.B2F_AllInjectors,
                data: injectors,
            })
        }
    }

    private reply(message: any) {
        window.postMessage({
            [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
            payload: message,
            direction: "TO_BACKGROUND",
        })
    }


    private disposeCallback: (() => void) | null = null;
    dispose(): void {
        if (this.disposeCallback !== null) {
            this.disposeCallback();
        }
    }
    public start() {

        const listener = (e: MessageEvent<any>) => {
            if (!e.data || !e.data[REDI_DEVTOOLS_MESSAGE_FLAG] || !(e.data.direction === "TO_PAGE")) {
                return;
            }

            const message = e.data.payload;
            this.onMessage(message);
        }

        window.addEventListener("message", listener)


        this.disposeCallback = () => {
            window.removeEventListener("message", listener);
        }


        new Promise<void>((resolve, reject) => {
            if (window.__REDI_DEVTOOLS_GLOBAL_HOOKS__?.innterMethods) {
                resolve();
            }
            const id = setInterval(() => {

                if (window.__REDI_DEVTOOLS_GLOBAL_HOOKS__?.innterMethods) {
                    clearInterval(id)
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(id)
                reject("Redi not installed")
            }, 10000);


        }).then(() => {
            window.postMessage({
                [REDI_DEVTOOLS_MESSAGE_FLAG]: true,
                cmd: BridgeCommands.Core_BackendApiReady,
                direction: "TO_CONTENT",
            })
        }).catch(()=>{
            // TODO
        })


    }

}