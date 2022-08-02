
export const enum DevHookEvents {
    InjectorCreated = 'injector:created',
    InjectorDisposed = 'injector:disposed',
    InjectorAdd = 'injector:add',
    InjectorRemove = 'injector:remove',

}


export const enum BridgeCommands {
    // Frontend to backend

    F2B_GetRootInjectors = "f2b:getRootInjectors",


    // Backend to front


}