
import { Injector } from "@wendellhu/redi"

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