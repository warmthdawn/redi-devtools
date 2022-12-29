import { Disposable, Inject } from "@wendellhu/redi";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { DependencyData, InjectorTreeNode } from "~/common/types";
import { DependencyService } from "./dependency-service";
import { FrontendApi } from "./frontend-api";
import { DependencyProvider, InjectorProvider } from "./hook-service";
import { InjectorService } from "./injector-service";


export class BackendApi implements Disposable {


    constructor(
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
        @Inject(DependencyProvider) private dependencyProvider: DependencyProvider,
        @Inject(DependencyService) private dependencyService: DependencyService,
        @Inject(InjectorService) private injectorService: InjectorService,
        @Inject(FrontendApi) private frontendApi: FrontendApi,
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
            this.frontendApi.sendAllDependencies(dependencies);
            return;
        }

        if(message.cmd === BridgeCommands.F2B_GetInjectors) {
            const injectors = this.getInjectors();
            this.frontendApi.sendAllInjectors(injectors);
        }
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
            this.frontendApi.markBackendReady();
        }).catch(()=>{
            // TODO
        })


    }

}