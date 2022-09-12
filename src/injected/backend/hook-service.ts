import { DependencyIdentifier, Disposable, Inject, Injector, Quantity, debug, LookUp } from "@wendellhu/redi";
import { InnerMethods } from "@wendellhu/redi/esm/innerMethods";
import { DevHookEvents } from "~/common/consts";
import { RediDevError } from "~/common/error";



export class InjectorProvider implements Disposable {

    private disposeCallback: (() => void) | undefined;
    private disposed = false;

    private hook: debug.DevHooks;
    private injectorMap: Map<number, Injector>
    private rootInjectorIds: Set<number> = new Set();


    constructor() {
        const hook = window.__REDI_DEVTOOLS_GLOBAL_HOOKS__!!;
        this.injectorMap = new Map();

        const addHook = (injector: Injector) => {
            if (injector._debuggerData!.parent === null) {
                this.rootInjectorIds.add(injector._debuggerData!.id);
            }
            this.injectorMap.set(injector._debuggerData!.id, injector);
        }
        const removeHook = (injector: Injector) => {
            if (injector._debuggerData!.parent === null) {
                this.rootInjectorIds.delete(injector._debuggerData!.id);
            }
            this.injectorMap.delete(injector._debuggerData!.id);
        }

        hook.on(DevHookEvents.InjectorAdd, addHook)
        hook.on(DevHookEvents.InjectorRemove, removeHook)


        this.disposeCallback = () => {
            hook.off(DevHookEvents.InjectorAdd, addHook)
            hook.off(DevHookEvents.InjectorRemove, removeHook)
        }

        const pendingInjectors = [...hook.rootInjectors.values()];

        for (const id of hook.rootInjectors.keys()) {
            this.rootInjectorIds.add(id)
        }

        while (pendingInjectors.length > 0) {
            const injector = pendingInjectors.pop()!;
            this.injectorMap.set(injector._debuggerData!.id, injector);
            const children = injector._debuggerData!.children;
            pendingInjectors.push(...children);
        }

        this.hook = hook;

    }





    dispose(): void {
        if (typeof this.disposeCallback !== "undefined") {
            this.disposeCallback();
            this.disposeCallback = undefined;
            this.disposed = true;
        }
        this.injectorMap.clear();
    }

    private checkNotDisposed() {
        if (this.disposed) {
            throw new Error("InjectorProvider is disposed!");
        }
    }

    public getRootInjectors() {
        this.checkNotDisposed();
        return [...this.rootInjectorIds].map(it => this.injectorMap.get(it)!);
    }

    public getInjector(id: number) {
        this.checkNotDisposed();
        return this.injectorMap.get(id);
    }

    public getChildrenRecursive(parent: Injector, output: Injector[]) {
        const children = parent._debuggerData!.children
        for (const child of children) {
            output.push(child)
            this.getChildrenRecursive(child, output)
        }
    }

    public getInjectors() {
        return [...this.injectorMap.values()];
    }

}

export class DebugMethodProvider {

    public get(): InnerMethods {
        return window.__REDI_DEVTOOLS_GLOBAL_HOOKS__?.innterMethods!!
    }
}

export class DependencyProvider implements Disposable {
    private disposeCallback: (() => void) | undefined;
    private injectorProvider: InjectorProvider
    private disposed = false;

    private dependencyById: Map<number, DependencyIdentifier<any>> = new Map();
    // private idByDependency: Map<[number, DependencyIdentifier<any>], number> = new Map();
    private idByDependency: Map<number, Map<DependencyIdentifier<any>, number>> = new Map();
    private currentId = 0;

    constructor(@Inject(InjectorProvider) injectorProvider: InjectorProvider) {
        this.injectorProvider = injectorProvider;
        const hook = window.__REDI_DEVTOOLS_GLOBAL_HOOKS__!!;
        const addHook = (injector: Injector, dependency: DependencyIdentifier<any>) => {
            const id = this.currentId++;
            const injectorId = injector._debuggerData!.id as number;

            this.dependencyById.set(id, dependency);
            if (!this.idByDependency.has(injectorId)) {
                this.idByDependency.set(injectorId, new Map());
            }
            this.idByDependency.get(injectorId)!.set(dependency, id);
        }
        const removeHook = (injector: Injector, dependency: DependencyIdentifier<any>) => {
            const injectorId = injector._debuggerData!.id as number;

            if (!this.idByDependency.has(injectorId)) {
                console.warn("[redi-dev] trying to remove a dependency from a unknown injector", injector)
                return;
            }

            const map = this.idByDependency.get(injectorId)!!

            if (!map.has(dependency)) {
                console.warn("[redi-dev] trying to remove a dependency before add, that is wrong!", dependency)
                return;
            }
            const id = map.get(dependency)!
            this.dependencyById.delete(id);
            map.delete(dependency);
            if (map.size === 0) {
                this.idByDependency.delete(injectorId);
            }

        }

        const addAllHooks = (injector: Injector) => {
            const deps = injector._debuggerData!.dependencyCollection.keys();

            for (const identifier of deps) {
                addHook(injector, identifier);
            }
            const unstandards = injector._debuggerData!.unstandardValueDependencies;

            for (const identifier of unstandards) {
                addHook(injector, identifier);
            }
        }



        const removeAllHooks = (injector: Injector) => {
            const deps = injector._debuggerData!.dependencyCollection.keys();

            for (const identifier of deps) {
                removeHook(injector, identifier);
            }
            const unstandards = injector._debuggerData!.unstandardValueDependencies;
            for (const identifier of unstandards) {
                removeHook(injector, identifier);
            }
        }

        hook.on(DevHookEvents.DependencyAdded, addHook)
        hook.on(DevHookEvents.DependencyRemoved, removeHook)
        hook.on(DevHookEvents.InjectorAdd, addAllHooks)
        hook.on(DevHookEvents.InjectorRemove, removeAllHooks)


        this.disposeCallback = () => {
            hook.off(DevHookEvents.DependencyAdded, addHook)
            hook.off(DevHookEvents.DependencyRemoved, removeHook)
            hook.off(DevHookEvents.InjectorAdd, addAllHooks)
            hook.off(DevHookEvents.InjectorRemove, removeAllHooks)
        }

        const injectors = injectorProvider.getInjectors()
        for (const injector of injectors) {
            addAllHooks(injector)
        }

    }

    

    private checkNotDisposed() {
        if (this.disposed) {
            throw new RediDevError("DependencyProvider is disposed!");
        }
    }

    public findAcutalInjector(startInjectorOrId: Injector | null | number, idetifier: DependencyIdentifier<any>, lookUp?: LookUp): Injector | null {
        const injector = typeof startInjectorOrId === "number" ? this.injectorProvider.getInjector(startInjectorOrId) : startInjectorOrId;
        if (!injector) {
            return null;
        }
        if (lookUp === LookUp.SKIP_SELF) {
            return this.findAcutalInjector(injector._debuggerData!.parent, idetifier);
        }

        const depMap = this.idByDependency.get(injector._debuggerData!.id as number);

        if (!!depMap && depMap.has(idetifier)) {
            return injector;
        }

        if (lookUp === LookUp.SELF) {
            return null;
        }
        
        return this.findAcutalInjector(injector._debuggerData!.parent, idetifier)
    }

    public getIdentifierId(injectorOrId: Injector | number, identifier: DependencyIdentifier<any>): number {
        const injectorId = typeof injectorOrId === "number" ? injectorOrId : injectorOrId._debuggerData!.id as number;
        const result = this.idByDependency.get(injectorId)?.get(identifier);
        if (typeof result === "undefined") {
            throw new RediDevError("Could not get id of identifier, maybe the injector is not handled by devtools.", identifier);
        }
        return result;
    }

    public getIdentitiferById(id: number) {
        return this.dependencyById.get(id);
    }

    public getDependencyItemById(ownerId: number, id: number) {
        const identifier = this.getIdentitiferById(id);
        if (typeof identifier === "undefined") {
            throw new Error("Could not find dependency item")
        }
        return this.getItemDependencies(ownerId, identifier)
    }

    dispose(): void {
        if (typeof this.disposeCallback !== "undefined") {
            this.disposeCallback();
            this.disposeCallback = undefined;
            this.disposed = true;
        }
        this.dependencyById.clear();
        this.idByDependency.clear();
        this.currentId = 0;
    }

    public getDirectDependencyItems(injectorId: number): DependencyIdentifier<any>[] {
        this.checkNotDisposed();
        const injector = this.injectorProvider.getInjector(injectorId);
        if (typeof injector === 'undefined') {
            return [];
        }
        const collection = injector._debuggerData!.dependencyCollection;
        const unstandardValues = injector._debuggerData!.unstandardValueDependencies;
        return [...collection.keys(), ...unstandardValues];
    }
    public getItemDependencies(ownerId: number, identifier: DependencyIdentifier<any>) {
        this.checkNotDisposed();
        const injector = this.injectorProvider.getInjector(ownerId);
        if (typeof injector === "undefined") {
            return [];
        }


        const collection = injector._debuggerData!.dependencyCollection;
        const result = collection.get(identifier, Quantity.MANY);


        return result;
    }


    private onInjectorAdd() {

    }

    private onInjectorRemoved() {

    }

    

}