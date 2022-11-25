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


export interface DependencyRelation {
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

export interface DependencyIdentifierData {
    nodeId: number,
    injectorId: number,
    name: string,
    isOptional?: boolean,
}

export interface DependencyData {
    identifier: DependencyIdentifierData,
    portCount: number,
    items: DependencyItemData[],
    startingEdges: DependencyRelation[]
}

export interface DependencyItemData {
    isAsync: boolean,
    isResolved: boolean,
    type: DependencyItemType,
}

export enum DependencyItemType {
    CLASS,
    FACTORY,
    VALUE,
    UNKNOWN,
}

// Injector

export interface InjectorData {
    injectorId: number,
    name: string,
    depth: number,
    dependencySize: number,
}

export interface InjectorTreeNode {
    id: number,
    name: string,
    dependencySize: number,
    parentId?: number,
    children: InjectorTreeNode[],
}


export interface InjectorResponse {
    injectors: InjectorData[],
    maxDepth: number,
}