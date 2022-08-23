import { Disposable, Inject } from "@wendellhu/redi";
import { REDI_DEVTOOLS_MESSAGE_FLAG } from "~/common/bridge";
import { BridgeCommands } from "~/common/consts";
import { BridgeCommand, DependencyResponse } from "~/common/types";
import { DependencyService } from "./dependencyService";
import { DependencyProvider, InjectorProvider } from "./hookService";


export class BackendApi implements Disposable {


    constructor(
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
        @Inject(DependencyProvider) private dependencyProvider: DependencyProvider,
        @Inject(DependencyService) private dependencyService: DependencyService,
    ) {

    }



    getDependencies(): DependencyResponse[] {
        return this.dependencyService.getDependencyNodes();
    }



    private onMessage(message: any) {
        if (message.cmd === BridgeCommands.F2B_GetDependencies) {
            const dependencies = this.getDependencies();
            this.reply({
                cmd: BridgeCommands.B2F_AllDependencies,
                data: dependencies,
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