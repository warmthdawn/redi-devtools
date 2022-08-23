import React from "react"
import { BackendApi } from "~/common/api"
import { BridgeCommands } from "~/common/consts"


export const DevtoolsBridgeContext = React.createContext<{
    backendApi: BackendApi | null
}>({
    backendApi: null,
})
DevtoolsBridgeContext.displayName = 'RediDevtoolsBridgeContext'

export function useBackendApi(): BackendApi {
    const injectionContext = React.useContext(DevtoolsBridgeContext)
    if (!injectionContext.backendApi) {
        throw new Error("Hook is not in a redi devtools context")
    }

    return injectionContext.backendApi;
}


export function WebExtensionBackendBridge(props: any) {
    const backendApi: BackendApi | null = null
    return (
        <DevtoolsBridgeContext.Provider value={{ backendApi }}>
            {props.children}
        </DevtoolsBridgeContext.Provider>
    )
}


function createBackendBridge(): BackendApi {

    return {
        async getRootInjectors() {

        },


    }

}