import React from "react";
import { DependencyData, InjectorResponse, InjectorTreeNode } from "~/common/types";
import { DependencyGraph } from "./graph";
import browser from 'webextension-polyfill'
import { BridgeCommands } from "~/common/consts";
import { InjectorModel, InjectorPresentation } from "../model/injector-model";
import { ModelContext } from "../utils/hooks";
import { DependencyDataModel } from "../model/dependency-model";
import { InjectorTree } from "./injector-tree";
import { GraphPanel } from "./graph-panel";

import "./dependency-view.css"


interface DependencyViewState {
    presentation: Map<number, InjectorPresentation>
}





export class DependencyView extends React.Component<{}, DependencyViewState> {

    constructor(props: React.PropsWithChildren<{}>) {
        super(props)

        this.state = {
            presentation: new Map()
        }
    }

    private connection: browser.Runtime.Port | null = null;

    static contextType?: React.Context<any> | undefined = ModelContext;

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
            cmd: BridgeCommands.F2B_GetInjectors
        })
        
        this.connection?.postMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            cmd: BridgeCommands.F2B_GetDependencies
        })

    }

    render(): React.ReactNode {
        return (
            <div className="content">
                <InjectorTree
                    injectorPresentation={this.state.presentation}
                    updatePresentation={(id, presentation) =>
                        this.setState({
                            presentation: new Map(this.state.presentation.set(id, presentation)),
                        })
                    } />
                <GraphPanel injectorPresentation={this.state.presentation} />
            </div>
        )
    }


    onMessage(message: any, conn: browser.Runtime.Port) {
        if (message.cmd === BridgeCommands.B2F_BackendApiReady) {
            this.backendInjected();
            return;
        }

        if (message.cmd === BridgeCommands.B2F_AllDependencies) {
            const dependencies = message.data as DependencyData[];
            const depModel: DependencyDataModel = this.context.dependencyModel;
            depModel.clear();
            dependencies.forEach(it => {
                depModel.addDependency(it);
            })
            return;
        }

        if (message.cmd === BridgeCommands.B2F_AllInjectors) {
            const injectors = message.data as InjectorTreeNode[];
            const injectorModel: InjectorModel = this.context.injectorModel;
            injectorModel.updateInjectors(injectors);
            return;
        }
    }


}