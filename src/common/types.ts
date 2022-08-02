import { Injector } from "@wendellhu/redi";
import { BridgeCommands } from "./consts";


export interface BridgeCommandArgsMap {
    [BridgeCommands.F2B_GetRootInjectors]: BridgeCommand
}


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
