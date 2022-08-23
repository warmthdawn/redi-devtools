
export const enum DevHookEvents {
    InjectorCreated = 'injector:created',
    InjectorDisposed = 'injector:disposed',
    InjectorAdd = 'injector:add',
    InjectorRemove = 'injector:remove',
    DependencyAdded = 'dependency:added',
    DependencyRemoved = 'dependency:removed',
    DependencyFetched = 'dependency:fetched',

}


export const enum BridgeCommands {
    // Core

    /**
     * Devtools初始化
     */
    Core_DevtoolsInit = "core:devtools-init",
    Core_PageLoadOrReload = "core:page-load-or-reload",
    /**
     * Backend 脚本注入情况
     */
    Core_InjectFullBackend = "core:inject-full-backend",
    Core_BackendApiReady = "core:backend-api-ready",

    // Frontend to backend

    F2B_GetInjectors = "f2b:get-injectors",

    F2B_GetDependencies = "f2b:get-dependencies",


    // Backend to front
    B2F_AllInjectors = 'b2f:all-injectors',
    B2F_AllDependencies = 'b2f:all-dependencies',
    B2F_BackendApiReady = "b2f:backend-api-ready",


}