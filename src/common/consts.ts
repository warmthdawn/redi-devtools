
export const enum DevHookEvents {
    InjectorCreated = 'injector:created',
    InjectorDisposed = 'injector:disposed',
    InjectorAdd = 'injector:add',
    InjectorRemove = 'injector:remove',
    DependencyAdded = 'dependency:added',
    DependencyRemoved = 'dependency:removed',
    DependencyFetched = 'dependency:fetched',
    LazyDependencyInitialized = 'dependency:lazy-init', 
    AsyncDependencyReady = 'dependency:async-ready', 
}


export const enum BridgeCommands {
    // Core

    /**
     * Devtools初始化
     */
    Core_DevtoolsInit = "core:devtools-init",
    Core_BackendDisconnected = "core:backend-disconnected",
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

    B2F_DependencyAdd = 'b2f:dependency-add',
    B2F_DependencyRemove = 'b2f:dependency-remove',
    B2F_DoRefresh = 'b2f:do-refresh',


}