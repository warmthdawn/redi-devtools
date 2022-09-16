
import { DependencyItem } from "@wendellhu/redi";
import { update } from "lodash-es";
import { Subject } from "rxjs";
import { DependencyData, DependencyRelation, InjectorResponse } from "~/common/types";
export enum NodeStatus {

}


export class DependencyDataModel {
    private nodes: Map<string, DependencyNode> = new Map();
    private edges: Map<string, DependencyEdge> = new Map();

    public readonly $update = new Subject<void>();

    public clear() {
        this.nodes.clear();
        this.edges.clear();
    }

    public addDependency(dep: DependencyData) {
        const edges: string[] = new Array(dep.startingEdges.length);
        const depId = dep.item.nodeId;
        for (let i = 0; i < dep.startingEdges.length; i++) {
            const item = dep.startingEdges[i];
            const edgeId = `e${item.fromNode.id}-${item.toNode.id}`;
            edges[i] = edgeId;
            this.addEdge(edgeId, item);
        }
        const nodeId = `n${depId}`;

        this.nodes.set(nodeId, {
            id: depId,
            nodeId,
            injectorId: dep.item.injectorId,
            text: dep.item.name,
            startingEdgeIds: edges,
        })

        this.$update.next();
    }

    public getNodes() {
        return [...this.nodes.values()];
    }

    public getEdges() {
        return [...this.edges.values()];
    }

    public addEdge(edgeId: string, rel: DependencyRelation) {

        const port =  typeof rel.fromPort === 'undefined' ? undefined : `p${rel.fromNode.id}-${rel.toNode.id}#${rel.fromPort}`

        this.edges.set(edgeId, {
            edgeId,
            fromInjector: rel.fromNode.injectorId,
            from: DependencyDataModel.nodeId(rel.fromNode.id),
            toInjector: rel.toNode.injectorId,
            to: DependencyDataModel.nodeId(rel.toNode.id),
            portIndex: port,
        })
    }


    public static nodeId(id: number): string {
        return `n${id}`
    }

    public getDependency(id: string) {
        return this.nodes.get(id);
    }

}


export interface DependencyNode {
    id: number,
    nodeId: string,
    injectorId: number,
    text: string,
    startingEdgeIds: string[],
}


export interface DependencyEdge {
    edgeId: string,
    from: string,
    to: string,
    fromInjector: number,
    toInjector: number,
    portIndex?: string,

}

export interface NodeMeta {
    id: number,
}

