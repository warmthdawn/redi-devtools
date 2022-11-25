import { DependencyItem, isAsyncDependencyItem, isClassDependencyItem, isFactoryDependencyItem, isValueDependencyItem, debug, Inject, Quantity, SyncDependencyItem, Injector, DependencyIdentifier } from "@wendellhu/redi";
import { isArray } from "lodash-es";
import { it } from "node:test";
import { REDI_DEVTOOLS_ASYNC_CACHE } from "~/common/bridge";
import { DependencyRelation, DependencyIdentifierData, DependencyData, DependencyItemData, DependencyItemType } from "~/common/types";
import { DebugMethodProvider, DependencyProvider, InjectorProvider } from "./hook-service";

type DependencyDescriptor<T> = debug.DependencyDescriptor<T>;

export class DependencyService {



    constructor(
        @Inject(DependencyProvider) private dependencyProvider: DependencyProvider,
        @Inject(InjectorProvider) private injectorProvider: InjectorProvider,
        @Inject(DebugMethodProvider) private debugMethod: DebugMethodProvider,
    ) {

    }



    public getChildrenDescriptorsForItem<T>(item: DependencyItem<T>): DependencyDescriptor<unknown>[] {

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
            const resolved = (item as any)[REDI_DEVTOOLS_ASYNC_CACHE];
            if (isArray(resolved)) {
                const item = resolved[0] as SyncDependencyItem<T>;
                if (isAsyncDependencyItem(item)) {
                    console.error("Async dependency returns another async dependency");
                    return [];
                }
                return this.getChildrenDescriptorsForItem(item);
            }

            if (typeof resolved === 'function') {
                return getDependencies(resolved)
                    .sort((a, b) => a.paramIndex - b.paramIndex)
                    .map((descriptor) => ({
                        ...descriptor,
                        identifier: normalizeForwardRef(descriptor.identifier),
                    }))
            }
            return [];
        }

        throw new Error("Unknown dependency item, possibly forget to normalize it?")
    }


    public isDependencyResolved<T>(identifier: DependencyIdentifier<T>, index: number, injector: Injector): boolean {
        try {
            const resolved = injector._debuggerData!.resolvedDependencyCollection.get(identifier, Quantity.MANY);
            if(resolved.length <= index) {
                return false;
            }
            return true;
        } catch (e: unknown) {
            return false;
        }
        return false;
    }

    public getDependencyItemData<T>(item: DependencyItem<T>, actuallyResolved: boolean): DependencyItemData {
        if (isValueDependencyItem(item)) {
            return {
                type: DependencyItemType.VALUE,
                isAsync: false,
                isResolved: true,
            }

        } else if (isFactoryDependencyItem(item)) {
            return {
                type: DependencyItemType.FACTORY,
                isAsync: false,
                isResolved: actuallyResolved,
            }
        } else if (isClassDependencyItem(item)) {
            return {
                type: DependencyItemType.CLASS,
                isAsync: false,
                isResolved: actuallyResolved,
            }
        } else if (isAsyncDependencyItem(item)) {
            const resolved = (item as any)[REDI_DEVTOOLS_ASYNC_CACHE];
            if (isArray(resolved)) {
                const item = resolved[0] as SyncDependencyItem<T>;
                if (isAsyncDependencyItem(item)) {
                    console.error("Async dependency returns another async dependency");
                    return {
                        type: DependencyItemType.UNKNOWN,
                        isAsync: true,
                        isResolved: false,
                    }
                }
                const result = this.getDependencyItemData(item, actuallyResolved);
                result.isAsync = true;
                return result;
            }

            if (typeof resolved === 'function') {
                return {
                    type: DependencyItemType.CLASS,
                    isAsync: true,
                    isResolved: actuallyResolved,
                }
            }

            if(typeof resolved !== 'undefined') {
                return {
                    type: DependencyItemType.VALUE,
                    isAsync: true,
                    isResolved: true,
                }
            }
        }
        return {
            type: DependencyItemType.UNKNOWN,
            isAsync: true,
            isResolved: false,
        }
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
                const childItems = this.dependencyProvider.getDependencyItemById(node.injectorId, node.nodeId);
                const edges = this.getDependencyEdgesFrom(node, childItems);

                const items = childItems.map((it, index) => {
                    const resolved = this.isDependencyResolved(identifier, index, injector);
                    return this.getDependencyItemData(it, resolved);
                });
                result.push(...edges.optinalNodes)
                result.push({
                    identifier: {
                        ...node,
                        name: text,
                    },
                    items,
                    portCount: childItems.length,
                    startingEdges: edges.edges,
                })
            }
        }

        return result;
    }

    public getDependencyEdgesFrom(node: { injectorId: number, nodeId: number }, items: DependencyItem<any>[]): { edges: DependencyRelation[], optinalNodes: DependencyData[], itemCount: number } {

        if (items.length === 0) {
            return { edges: [], optinalNodes: [], itemCount: 0 };
        }

        const resultEdges: DependencyRelation[] = [];
        const extraOptionalNodes: DependencyData[] = [];
        const fromNode = {
            id: node.nodeId,
            injectorId: node.injectorId,
        }
        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            const descriptors = this.getChildrenDescriptorsForItem(element);

            for (const desc of descriptors) {
                const toNodeInjector = this.dependencyProvider.findAcutalInjector(node.injectorId, desc.identifier, desc.lookUp)
                let toNode;
                if (toNodeInjector === null) {
                    // TODO: 找不到，这里可以考虑在前端进行提示
                    if (desc.quantity === Quantity.OPTIONAL) {
                        const toNodeInjectorId = fromNode.injectorId
                        // TODO: create optional node
                        const toNodeId = 0;
                        toNode = {
                            id: toNodeId,
                            injectorId: toNodeInjectorId,
                        }
                    }
                    continue;
                } else {
                    const toNodeInjectorId = toNodeInjector?._debuggerData!.id as number;
                    const toNodeId = this.dependencyProvider.getIdentifierId(toNodeInjectorId, desc.identifier);
                    toNode = {
                        id: toNodeId,
                        injectorId: toNodeInjectorId,
                    }
                }

                resultEdges.push({
                    fromNode,
                    toNode,
                    fromPort: i,
                })

            }
        }

        return {
            edges: resultEdges,
            optinalNodes: extraOptionalNodes,
            itemCount: items.length,
        };

    }
}