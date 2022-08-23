import type { Injector, debug } from "@wendellhu/redi";
import { DevHookEvents } from "~/common/consts";



/**
 * 向浏览器注入一部分脚本
 * 这个脚本会注入到每个浏览器页面，所以尽量不要在这边依赖外部模块。
 * 因为目标浏览器创建 Injector 等时机不确定。
 * @param target window 或者 global 对象
 */
function installHook(target: any) {
    const devtoolsVersion = '1.0'
    let listeners: any = {}

    if (Object.prototype.hasOwnProperty.call(target, '__REDI_DEVTOOLS_GLOBAL_HOOKS__')) {
        if (target.__REDI_DEVTOOLS_GLOBAL_HOOKS__.devtoolsVersion !== devtoolsVersion) {
            console.error(`Another version of Redi Devtools seems to be installed. Please enable only one version at a time.`)
        }
        return
    }

    let hook: debug.DevHooks;

    hook = {
        devtoolsVersion,
        _listeners: listeners,
        enabled: undefined,
        rootInjectors: new Map(),

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

    let currentId = 0;

    // 这里监听两个事件是为了在devtools启动之前就保存Injector
    hook.on(DevHookEvents.InjectorCreated, (injector: Injector) => {
        let id = currentId++;
        injector._debuggerData!.id = id;
        if(injector._debuggerData!.parent === null) {
            hook.rootInjectors.set(id, injector);
        }
        hook.emit(DevHookEvents.InjectorAdd, injector)
        console.log('[redi-dev] Injector created', injector);
    })
    hook.on(DevHookEvents.InjectorDisposed, (injector: Injector) => {
        const id = injector._debuggerData!.id;
        if(injector._debuggerData!.parent === null) {
            const removed = hook.rootInjectors.delete(id);
            if (removed) {
                hook.emit(DevHookEvents.InjectorRemove, injector)
            }
        }
        console.log('[redi-dev] Injector disposed', injector);
        injector._debuggerData!.id = -1;
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