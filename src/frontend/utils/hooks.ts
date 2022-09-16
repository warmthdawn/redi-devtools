import React, { useEffect, useState } from "react";
import { Observable } from "rxjs";
import { DependencyDataModel } from "../model/dependency-model";
import { InjectorModel } from "../model/injector-model";


export function useListener<T>($rx?: Observable<T>, filter?: (data: T) => boolean) {
    if (typeof $rx === "undefined") {
        return;
    }
    const [, updateDirty] = useState(0)

    useEffect(() => {
        const subscription = $rx.subscribe(it => {
            if (!filter || filter(it)) {
                updateDirty((prev) => prev + 1)
            }
        })
        return () => subscription.unsubscribe()
    }, [])
}

export interface ModelContext {
    dependencyModel: DependencyDataModel | null
    injectorModel: InjectorModel | null
}

export const ModelContext = React.createContext<ModelContext>({
    dependencyModel: null,
    injectorModel: null,
})

export function useModel() {
    return React.useContext(ModelContext)
}