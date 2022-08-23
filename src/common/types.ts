import { Injector } from "@wendellhu/redi";
import { BridgeCommands } from "./consts";



export interface BridgeCommand {
    tabId: number;
}



export interface DevHooks {
    devtoolsVersion: string,
    enabled?: boolean
    emit: (event: string, ...payload: any[]) => void
    on: (event: string, handler: (...args: any[]) => void) => void
    once: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
    rootInjectors: Injector[],
    _listeners: any,
}


export interface DependencyEdge {
    fromNode: {
        id: number,
        injectorId: number,
    },
    toNode: {
        id: number,
        injectorId: number,
    },
    fromPort?: number,
}

export interface DependencyNode {
    nodeId: number,
    injectorId: number,
    name: string,
    description: string,
    state: DependencyState,
}

export interface DependencyResponse {
    node: DependencyNode,
    startingEdges: DependencyEdge[]
}


export enum DependencyState {
    Unknown,
}