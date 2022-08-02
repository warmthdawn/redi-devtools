/// <reference types="vite/client" />
/// <reference types="@samrum/vite-plugin-web-extension/client" />

import { DevHooks } from "./types/hooks";


declare global {
    interface Window {
        __REDI_DEVTOOLS_GLOBAL_HOOKS__: DevHooks | undefined
    }
}
