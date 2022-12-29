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
    backendReady: boolean,
}





export class DependencyView extends React.Component<{}, DependencyViewState> {

    constructor(props: React.PropsWithChildren<{}>) {
        super(props)

        this.state = {
            presentation: new Map(),
            backendReady: false,
        }
    }

    private connection: browser.Runtime.Port | null = null;

    static contextType?: React.Context<any> | undefined = ModelContext;

    // 防止因为state刷新不及时丢事件
    private backendReady = false;

    componentDidMount() {

        this.connection = browser.runtime.connect({
            name: "devtools-dependency-view"
        })

        this.connection?.onMessage?.addListener(this.onMessage.bind(this))

        this.connection?.postMessage({
            cmd: BridgeCommands.Core_DevtoolsInit,
            tabId: browser.devtools.inspectedWindow.tabId,
        })

        this.connection?.onDisconnect?.addListener(this.onDisconnect.bind(this));

    }
    componentWillUnmount() {

        this.connection?.disconnect();

    }

    onDisconnect(port: browser.Runtime.Port) {
        this.setState({
            backendReady: false,
        });
        this.backendReady = false;
    }

    refresh() {

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
        return [
            (<div className="content">
                <InjectorTree
                    injectorPresentation={this.state.presentation}
                    updatePresentation={(id, presentation) =>
                        this.setState({
                            presentation: new Map(this.state.presentation.set(id, presentation)),
                        })
                    } />
                <GraphPanel injectorPresentation={this.state.presentation} />
            </div>),
            this.state.backendReady ? null : 
            (
                <div className='modal'>
                    <div className="modal-content">
                        <p>Devtools could not connect to page...</p>
                    </div>
                </div>
            )

        ]
    }


    onMessage(message: any, conn: browser.Runtime.Port) {
        if (message.cmd === BridgeCommands.Core_BackendDisconnected) {
            this.setState({
                backendReady: false,
            });
            this.backendReady = false;
        }
        if (message.cmd === BridgeCommands.B2F_BackendApiReady) {
            this.setState({
                backendReady: true,
            });
            this.backendReady = true;
            this.refresh();
            return;
        }

        if (!this.backendReady) {
            return;
        }
        if (message.cmd === BridgeCommands.B2F_DoRefresh) {
            this.refresh();
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

        if (message.cmd === BridgeCommands.B2F_DependencyRemove) {

        }

        if (message.cmd === BridgeCommands.B2F_DependencyAdd) {

        }
    }


}