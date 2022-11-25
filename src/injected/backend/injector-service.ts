import { Inject, Injector } from "@wendellhu/redi";
import { InjectorData, InjectorResponse, InjectorTreeNode } from "~/common/types";
import { DependencyProvider, InjectorProvider } from "./hook-service";

export class InjectorService {
    constructor(
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
    ) { }

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