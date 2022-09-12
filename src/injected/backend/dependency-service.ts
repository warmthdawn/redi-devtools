import { DependencyItem, isAsyncDependencyItem, isClassDependencyItem, isFactoryDependencyItem, isValueDependencyItem, debug, Inject } from "@wendellhu/redi";
import { DependencyEdge, DependencyItemData, DependencyData, DependencyState } from "~/common/types";
import { DebugMethodProvider, DependencyProvider, InjectorProvider } from "./hook-service";

type DependencyDescriptor<T> = debug.DependencyDescriptor<T>;

export class DependencyService {



    constructor(
        @Inject(DependencyProvider) private dependencyProvider: DependencyProvider,
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
        @Inject(DebugMethodProvider) private debugMethod: DebugMethodProvider,
    ) {

    }



    public getItemDescriptors<T>(item: DependencyItem<T>): DependencyDescriptor<T>[] {

        const { normalizeFactoryDeps, normalizeForwardRef, getDependencies } = this.debugMethod.get();
        if (isValueDependencyItem(item)) {
            return [];

        } else if (isFactoryDependencyItem(item)) {
            return normalizeFactoryDeps(item.deps);
        } else if (isClassDependencyItem(item)) {
            return getDependencies(item.useClass)
                .sort((a, b) => a.paramIndex - b.paramIndex)
                .map((descriptor) => ({
                    ...descriptor,
                    identifier: normalizeForwardRef(descriptor.identifier),
                }))
        } else if (isAsyncDependencyItem(item)) {
            // TODO: async的依赖如何解析？
            return [];
        }

        throw new Error("Unknown dependency item, possibly forget to normalize it?")
    }

    public getDependencyNodes() {
        const { prettyPrintIdentifier } = this.debugMethod.get();
        const result: DependencyData[] = [];
        const injectors = this.injectorProvider.getInjectors();
        for (const injector of injectors) {
            const id = injector._debuggerData!.id;
            const dependencyItems = this.dependencyProvider.getDirectDependencyItems(id)

            for (const identifier of dependencyItems) {
                const nodeId = this.dependencyProvider.getIdentifierId(injector, identifier)!;
                const text = prettyPrintIdentifier(identifier)
                const node = {
                    injectorId: id,
                    nodeId,
                }
                const edges = this.getDependencyEdgesFrom(node)
                result.push({
                    item: {
                        ...node,
                        name: text,
                        description: 'todo',
                        state: DependencyState.Unknown,
                    },
                    startingEdges: edges,
                })
            }
        }

        return result;
    }

    public getDependencyEdgesFrom(node: { injectorId: number, nodeId: number }) {
        const items = this.dependencyProvider.getDependencyItemById(node.injectorId, node.nodeId);
        if (items.length === 0) {
            return [];
        }

        const result: DependencyEdge[] = [];

        const fromNode = {
            id: node.nodeId,
            injectorId: node.injectorId,
        }
        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            const descriptors = this.getItemDescriptors(element);

            for (const desc of descriptors) {
                const toNodeInjector = this.dependencyProvider.findAcutalInjector(node.injectorId, desc.identifier, desc.lookUp)
                if (toNodeInjector === null) {
                    // TODO: 找不到，这里可以考虑在前端进行提示
                    continue;
                }
                const toNodeInjectorId = toNodeInjector?._debuggerData!.id as number;
                const toNodeId = this.dependencyProvider.getIdentifierId(toNodeInjectorId, desc.identifier);

                result.push({
                    fromNode,
                    toNode: {
                        id: toNodeId,
                        injectorId: toNodeInjectorId,
                    },
                    fromPort: i,
                })

            }
        }

        return result;

    }
}