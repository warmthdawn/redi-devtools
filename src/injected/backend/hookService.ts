import { Disposable, Injector } from "@wendellhu/redi";
import { Subscription } from "rxjs";
import { DevHookEvents } from "~/common/consts";
import { IdObjectHolder } from "~/common/misc";
import { DevHooks } from "~/types/hooks";


export class InjectorProvider implements Disposable {

    private offEvents: (() => void) | undefined;
    private disposed = false;

    private injectorHolder: IdObjectHolder<Injector>


    constructor() {
        const hook = window.__REDI_DEVTOOLS_GLOBAL_HOOKS__!!;
        const injectorHolder = new IdObjectHolder<Injector>();
        injectorHolder.fill(hook.rootInjectors);

        const addHook = (injector: Injector) => injectorHolder.add(injector);
        const removeHook = (injector: Injector) => injectorHolder.add(injector);

        hook.on(DevHookEvents.InjectorAdd, addHook)
        hook.on(DevHookEvents.InjectorRemove, removeHook)


        this.offEvents = () => {
            hook.off(DevHookEvents.InjectorAdd, addHook)
            hook.off(DevHookEvents.InjectorRemove, removeHook)
        }

        this.injectorHolder = injectorHolder;
    }


    dispose(): void {
        if (typeof this.offEvents !== "undefined") {
            this.offEvents();
            this.offEvents = undefined;
            this.disposed = true;
        }
    }

    private checkNotDisposed() {
        if (this.disposed) {
            throw new Error("InjectorProvider is disposed!");
        }
    }

    getRootInjectors() {
        this.checkNotDisposed();
        return [...this.injectorHolder.entries()]
    }




}