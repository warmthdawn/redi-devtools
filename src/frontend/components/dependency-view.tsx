import React from "react";
import { DependencyData, InjectorResponse } from "~/common/types";
import { DependencyGraph, InjectorPresentation } from "./graph";
import browser from 'webextension-polyfill'
import { BridgeCommands } from "~/common/consts";


interface DependencyViewState {
    dependencies: DependencyData[],
    injectors: InjectorResponse,
    presentation: Map<number, InjectorPresentation>
}





export class DependencyView extends React.Component<{}, DependencyViewState> {

    constructor(props: React.PropsWithChildren<{}>) {
        super(props)

        this.state = {
            dependencies: [],
            injectors: {
                injectors: [],
                maxDepth: 0,
            },
            presentation: new Map()
        }
    }

    private connection: browser.Runtime.Port | null = null;

    componentDidMount() {

        this.connection = browser.runtime.connect({
            name: "devtools-dependency-view"
        })

        this.connection?.onMessage.addListener(this.onMessage.bind(this))

        this.connection?.postMessage({
            cmd: BridgeCommands.Core_DevtoolsInit,
            tabId: browser.devtools.inspectedWindow.tabId,
        })

    }
    componentWillUnmount() {

        this.connection?.disconnect();

    }

    backendInjected() {

        this.connection?.postMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            cmd: BridgeCommands.F2B_GetDependencies
        })

        this.connection?.postMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            cmd: BridgeCommands.F2B_GetInjectors
        })
    }

    render(): React.ReactNode {
        return (
            <DependencyGraph
                dependencies={this.state.dependencies}
                injectors={this.state.injectors}
                presentation={this.state.presentation}
            />
        )
    }


    onMessage(message: any, conn: browser.Runtime.Port) {
        if (message.cmd === BridgeCommands.B2F_BackendApiReady) {
            this.backendInjected();
            return;
        }

        if (message.cmd === BridgeCommands.B2F_AllDependencies) {
            const dependencies = message.data as DependencyData[];
            this.setState({
                dependencies
            });
            return;
        }

        if (message.cmd === BridgeCommands.B2F_AllInjectors) {
            const injectors = message.data as InjectorResponse;
            this.setState({
                injectors
            });
            return;
        }
    }


}