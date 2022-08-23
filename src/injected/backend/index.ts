import { Injector } from "@wendellhu/redi";
import { BackendApi } from "./backendApi";
import { DependencyService } from "./dependencyService";
import { DebugMethodProvider, DependencyProvider, InjectorProvider } from "./hookService";



const injector = new Injector([
    [DependencyService],
    [InjectorProvider],
    [DependencyProvider],
    [BackendApi],
    [DebugMethodProvider]
], { hideInDevtools: true });


injector.get(BackendApi).start();

