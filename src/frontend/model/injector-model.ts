import { Subject } from "rxjs";
import { InjectorTreeNode } from "~/common/types";


export class InjectorModel {
    private rootNodes: InjectorNode[] = [];
    private nodeMap: Map<number, InjectorNode> = new Map();;
    private maxDepth = 0;

    public $update = new Subject<{
        isAdd: boolean,
        injectorId: number,
    }>();


    public getInjector(id: number) {
        return this.nodeMap.get(id);
    }

    public getTree() {
        return this.rootNodes;
    }

    public getInjectors(): InjectorNode[] {
        return [...this.nodeMap.values()]
    }

    public getDepth(id: number) {
        const injector = this.getInjector(id);
        if(!injector) {
            return 0;
        }

        return this.maxDepth - injector.depth + 1;
    }


    public updateInjectors(roots: InjectorTreeNode[]) {

        const pervious = new Set(this.nodeMap.keys());

        this.nodeMap.clear();
        this.maxDepth = 0;
        this.rootNodes = [];
        for (const node of roots) {
            const root = this.processInjector(node, 1);
            this.rootNodes.push(root);
        }

        const newResult = new Set(this.nodeMap.keys());

        newResult.forEach(it => {
            if (!pervious.has(it)) {
                this.$update.next({
                    isAdd: true,
                    injectorId: it
                })
            }
        })

        pervious.forEach(it => {
            if (!newResult.has(it)) {
                this.$update.next({
                    isAdd: false,
                    injectorId: it,
                })
            }
        })

    }

    private processInjector(node: InjectorTreeNode, depth: number): InjectorNode {
        const { id, name, dependencySize, parentId, children } = node;

        this.maxDepth = Math.max(this.maxDepth, depth);
        const newChildren = children.map(it => this.processInjector(it, depth + 1));

        const result: InjectorNode = {
            id,
            name: name,
            children: newChildren,
            depth: depth,
            dependencySize,
            parentId,
            presentation: InjectorPresentation.EXPANDED,
        }

        this.nodeMap.set(id, result);

        return result;
    }
}


export interface InjectorNode {
    id: number,
    name: string,
    children?: InjectorNode[]
    depth: number,
    dependencySize: number,
    parentId?: number,
    presentation: InjectorPresentation,
}


export enum InjectorPresentation {
    /**
     * 完全隐藏 Injector 和它所包含的 Dependency、子 Injector
     */
    HIDDEN = 0,
    /**
     * 将Injector只显示为一个节点
     */
    COLLPASED = 1,
    /**
     * 只显示 Injector 中被依赖的节点
     */
    EXTERNALIZED = 2,
    /**
     * 只显示被依赖的节点，分组展示，不限显示内部关系
     */
    GROUPED = 3,
    /**
     * 完全展开节点
     */
    EXPANDED = 4,
}