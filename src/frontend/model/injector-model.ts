import { Subject } from "rxjs";
import { InjectorTreeNode } from "~/common/types";


export class InjectorModel {
    private rootNodes: InjectorNode[] = [];
    private nodeMap: Map<number, InjectorNode> = new Map();;
    private maxDepth = 0;
    private rootDepthes: number[] = [];

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

        const currDepth = this.rootDepthes[injector.depth] || 0;

        return currDepth - injector.depth + 1;
    }


    public updateInjectors(roots: InjectorTreeNode[]) {

        const pervious = new Set(this.nodeMap.keys());

        this.nodeMap.clear();
        const rootLength = roots.length;
        this.rootDepthes = new Array(rootLength);
        this.rootNodes = new Array(rootLength);
        this.maxDepth = 0;
        for(let i = rootLength - 1; i >= 0; i--) {
            const node = roots[i];
            const root = this.processInjector(node, this.maxDepth + 1, i);
            this.rootNodes[i] = root;
            this.rootDepthes[i] = this.maxDepth;
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

    private processInjector(node: InjectorTreeNode, depth: number, rootGroup: number): InjectorNode {
        const { id, name, dependencySize, parentId, children } = node;

        this.maxDepth = Math.max(this.maxDepth, depth);
        const newChildren = children.map(it => this.processInjector(it, depth + 1, rootGroup));

        const result: InjectorNode = {
            id,
            name: name,
            children: newChildren,
            depth: depth,
            dependencySize,
            parentId,
            presentation: InjectorPresentation.EXPANDED,
            rootGroup,
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
    rootGroup: number,
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