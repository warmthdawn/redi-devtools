import { Inject } from "@wendellhu/redi";
import { Bridge } from "~/common/bridge";
import { InjectorProvider } from "./hookService";


export class BackendApi {


    constructor(
        private bridge: Bridge,
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,



    ) {

    }


}