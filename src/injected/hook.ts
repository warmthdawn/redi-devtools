import { DevHookEvents } from "~/utils/consts";

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

function installHook(target: any) {
    const devtoolsVersion = '1.0'
    let listeners: any = {}

    if (Object.prototype.hasOwnProperty.call(target, '__REDI_DEVTOOLS_GLOBAL_HOOKS__')) {
        if (target.__REDI_DEVTOOLS_GLOBAL_HOOKS__.devtoolsVersion !== devtoolsVersion) {
            console.error(`Another version of Redi Devtools seems to be installed. Please enable only one version at a time.`)
        }
        return
    }

    let hook: DevHooks;

    hook = {
        devtoolsVersion,
        _listeners: listeners,
        enabled: undefined,
        rootInjectors: [],

        on(event: string, fn: (...args: any[]) => void) {
            const $event = '$' + event
            if (listeners[$event]) {
                listeners[$event].push(fn)
            } else {
                listeners[$event] = [fn]
            }
        },

        once(event: string, fn: (...args: any[]) => void) {
            const on = (...args: any[]) => {
                this.off(event, on)
                return fn.apply(this, args)
            }
            this.on(event, on)
        },

        off(event: string, fn: (...args: any[]) => void) {
            if (!arguments.length) {
                listeners = {}
            } else {
                event = '$' + event
                const cbs = listeners[event]
                if (cbs) {
                    if (!fn) {
                        listeners[event] = null
                    } else {
                        for (let i = 0, l = cbs.length; i < l; i++) {
                            const cb = cbs[i]
                            if (cb === fn || cb.fn === fn) {
                                cbs.splice(i, 1)
                                break
                            }
                        }
                    }
                }
            }
        },

        emit(event, ...args) {
            const $event = '$' + event
            let cbs = listeners[$event]
            if (cbs) {
                cbs = cbs.slice()
                for (let i = 0, l = cbs.length; i < l; i++) {
                    try {
                        const result = cbs[i].apply(this, args)
                        if (typeof result?.catch === 'function') {
                            result.catch((e: Error) => {
                                console.error(`[Hook] Error in async event handler for ${event} with args:`, args)
                                console.error(e)
                            })
                        }
                    } catch (e) {
                        console.error(`[Hook] Error in event handler for ${event} with args:`, args)
                        console.error(e)
                    }
                }
            }
        },
    }

    hook.on(DevHookEvents.InjectorCreated, (injector: any) => {
        hook.rootInjectors.push(injector);
        console.log('[redi-dev] Injector created', injector);
    })
    hook.on(DevHookEvents.InjectorDisposed, (injector: any) => {
        const index = hook.rootInjectors.indexOf(injector);
        if (index >= 0) {
            hook.rootInjectors.splice(index, 1);
            console.log('[redi-dev] Injector disposed', injector);
        }
    })


    Object.defineProperty(target, '__REDI_DEVTOOLS_GLOBAL_HOOKS__', {
        get() {
            return hook
        },
    })

    // Handle apps initialized before hook injection
    if (target.__REDI_DEVTOOLS_HOOK_CALLBACKS__) {
        try {
            const cbs = target.__REDI_DEVTOOLS_HOOK_CALLBACKS__;
            for (let i = 0, l = cbs.length; i < l; i++) {
                const cb = cbs[i];
                cb();
            }
            target.__REDI_DEVTOOLS_HOOK_CALLBACKS__ = []
        } catch (e) {
            console.error('[redi-devtools] Error during hook callback', e)
        }
    }
}

installHook(window)