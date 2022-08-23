import React from "react";
import { DependencyResponse } from "~/common/types";
import { DependencyGraph } from "./graph";
import browser from 'webextension-polyfill'
import { BridgeCommands } from "~/common/consts";


interface DependencyViewState {
    dependencies: DependencyResponse[],
}


export class DependencyView extends React.Component<{}, DependencyViewState> {

    constructor(props: any) {
        super(props)

        this.state = {
            dependencies: [],
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
    }

    render(): React.ReactNode {
        return <DependencyGraph dependencies={this.state.dependencies} />
    }


    onMessage(message: any, conn: browser.Runtime.Port) {
        if (message.cmd === BridgeCommands.B2F_BackendApiReady) {
            this.backendInjected();
            return;
        }

        if (message.cmd === BridgeCommands.B2F_AllDependencies) {
            const dependencies = message.data as DependencyResponse[];
            this.setState({
                dependencies
            });
            return;
        }
    }


}