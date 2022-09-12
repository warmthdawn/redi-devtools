import { Injector } from "@wendellhu/redi";
import { BackendApi } from "./backend-api";
import { DependencyService } from "./dependency-service";
import { DebugMethodProvider, DependencyProvider, InjectorProvider } from "./hook-service";
import { InjectorService } from "./injector-service";



const injector = new Injector([
    [DependencyService],
    [InjectorProvider],
    [DependencyProvider],
    [BackendApi],
    [DebugMethodProvider],
    [InjectorService],
], { hideInDevtools: true });


injector.get(BackendApi).start();

