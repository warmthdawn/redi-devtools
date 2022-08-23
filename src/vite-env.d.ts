/// <reference types="vite/client" />
/// <reference types="@samrum/vite-plugin-web-extension/client" />

import { debug } from "@wendellhu/redi";


declare global {
    interface Window {
        __REDI_DEVTOOLS_GLOBAL_HOOKS__: debug.DevHooks | undefined
    }
}
