import { Inject, Injector } from "@wendellhu/redi";
import { InjectorData, InjectorResponse, InjectorTreeNode } from "~/common/types";
import { DependencyProvider, InjectorProvider } from "./hook-service";

export class InjectorService {
    constructor(
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
    ) { }

    public getInjectors(): InjectorResponse {

        const injectors = this.injectorProvider.getInjectors();

        const result: InjectorData[] = new Array(injectors.length);

        let maxDepth = 0;
        for (let i = 0; i < injectors.length; i++) {
            const element = injectors[i];
            const depth = this.injectorDepth(element);
            const dependencySize = this.countDependencies(element);

            maxDepth = Math.max(depth, maxDepth);
            result[i] = {
                injectorId: element._debuggerData!.id as number,
                depth,
                dependencySize,
            }
        }

        return {
            injectors: result,
            maxDepth,
        }

    }

    public getInjectorTree(): InjectorTreeNode[] {
        const roots = this.injectorProvider.getRootInjectors();

        return roots.map(node => this._createNode(node))
    }

    public _createNode(injector: Injector) : InjectorTreeNode {
        return {
            id: injector._debuggerData!.id as number,
            name: injector.getName(),
            dependencySize: this.countDependencies(injector),
            children: injector._debuggerData!.children.map(it=>this._createNode(it))
        }
    }


    public injectorDepth(injector: Injector): number {
        let depth = 0;
        while(injector._debuggerData!.parent) {
            injector = injector._debuggerData!.parent;
            depth++;
        }
        return depth;
    }

    public countDependencies(injector: Injector) {
        return injector._debuggerData!.dependencyCollection.size() + injector._debuggerData!.unstandardValueDependencies.size;
    }
}