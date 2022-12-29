import React, { useCallback, useEffect, useState } from 'react';
import { Canvas, NodeData, EdgeData, Node, NodeProps, EdgeProps, Edge, PortData } from 'reaflow';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import './graph.css'
import { InjectorPresentation } from '../model/injector-model';
import { DependencyEdge, DependencyNode } from '../model/dependency-model';
import { useModel } from '../utils/hooks';
import { debounceTime, merge } from 'rxjs';

export interface DepNodeMetadata {
  injectorId: number,
  type: 'dependency'
}


export interface InjectorNodeMetadata {
  injectorId: number,
  injectorName: string,
  hasChildren: boolean,
  type: 'injector'
}

export type NodeMetadata = DepNodeMetadata | InjectorNodeMetadata

export interface DependencyGraphProps {
  nodeRender: (nodeProps: NodeProps) => React.ReactElement<NodeProps, typeof Node>,
  edgeRender: (edgeProps: EdgeProps) => React.ReactElement<EdgeProps, typeof Edge>,
  injectorPresentation: Map<number, InjectorPresentation>
}

export function DependencyGraph(props: DependencyGraphProps) {

  const { nodeRender, edgeRender, injectorPresentation } = props;

  const [nodes, setNodes] = useState<NodeData<NodeMetadata>[]>([]);
  const [edges, setEdges] = useState<EdgeData<void>[]>([]);
  const { injectorModel, dependencyModel } = useModel();


  const createNode = useCallback((node: DependencyNode, depth?: string): NodeData<NodeMetadata> => {
    const ports: PortData[] = [];
    for (let i = 0; i < node.portCount; i++) {
      ports.push({
        id: `p${node.id}#${i}`,
        height: 0,
        width: 0,
        hidden: true,
        side: 'SOUTH'
      })
    }

    if (depth) {
      return {
        id: node.nodeId,
        text: node.text + "[" + depth + "]",
        layoutOptions: {
          'partitioning.partition': depth,
          'portConstraints': 'FIXED_SIDE',
        } as any,
        data: {
          injectorId: node.injectorId,
          type: 'dependency',
        },
        ports,
      }
    }
    return {
      id: node.nodeId,
      text: node.text,
      layoutOptions: {
        'portConstraints': 'FIXED_SIDE',
      } as any,
      data: {
        injectorId: node.injectorId,
        type: 'dependency',
      },
      ports,
    }
  }, [])

  const createEdge = useCallback((edge: DependencyEdge): EdgeData<void> => {

    return {
      id: edge.edgeId,
      from: edge.from,
      to: edge.to,
      fromPort: edge.portIndex,
    }
  }, []);

  const getPresentation = useCallback((injectorId: number) => {
    let presentation = injectorPresentation.get(injectorId);
    if (typeof presentation === 'undefined') {
      presentation = InjectorPresentation.EXPANDED;
    }
    return presentation;
  }, [injectorPresentation])

  const refreshGraph = useCallback(() => {


    const hiddenEdges = new Set();
    const externalNodes = new Set();

    const nodes = dependencyModel!.getNodes();
    const edges = dependencyModel!.getEdges();
    edges.forEach(it => {
      if (it.fromInjector === it.toInjector) {
        if (getPresentation(it.fromInjector) < InjectorPresentation.EXPANDED) {
          hiddenEdges.add(it.edgeId);
        }
      } else {
        externalNodes.add(it.from);
        externalNodes.add(it.to);
        const fromPres = getPresentation(it.fromInjector);
        const toPres = getPresentation(it.toInjector);

        if (fromPres === InjectorPresentation.HIDDEN || toPres === InjectorPresentation.HIDDEN) {
          hiddenEdges.add(it.edgeId);
          return;
        }

      }
    });



    const renderingNodes: NodeData<NodeMetadata>[] = [];

    const rendeingInjectors: Map<number, boolean> = new Map();

    

    nodes.forEach(it => {
      const presentation = getPresentation(it.injectorId);
      if (presentation === InjectorPresentation.HIDDEN) {
        // hidden
        return;
      }
      const [depth, maxDepth] = injectorModel!.getDepth(it.injectorId).map(it => it.toString());
      if (presentation === InjectorPresentation.EXPANDED) {
        renderingNodes.unshift(createNode(it, depth))
        return;
      }

      if (presentation === InjectorPresentation.EXTERNALIZED) {
        if (externalNodes.has(it.nodeId)) {
          renderingNodes.unshift(createNode(it, maxDepth))
        }
        return;
      }

      if (presentation === InjectorPresentation.GROUPED || presentation === InjectorPresentation.FULL) {
        const node = createNode(it);
        node.parent = `i${it.injectorId}`;
        rendeingInjectors.set(it.injectorId, true)
        renderingNodes.unshift(node)
      } else {
        rendeingInjectors.set(it.injectorId, false)
      }

    })

    rendeingInjectors.forEach((hasChildren, id) => {
      const injector = injectorModel!.getInjector(id)
      const depth = injectorModel!.getDepth(id)[0].toString();
      const data: InjectorNodeMetadata = {
        injectorId: id,
        injectorName: injector?.name || "Unknown",
        hasChildren,
        type: "injector",
      };
      if (hasChildren) {

        renderingNodes.push({
          id: `i${id}`,
          nodePadding: [32, 5, 5, 5],
          layoutOptions: {
            'partitioning.partition': depth || "0",
            'portConstraints': 'FREE',
          } as any,
          data,
        })
      } else {
        renderingNodes.push({
          id: `i${id}`,
          text: injector?.name || "Unknown",
          layoutOptions: {
            'partitioning.partition': depth || "0",
            'portConstraints': 'FIXED_SIDE',
          } as any,
          data,
        })
      }
    })

    const renderingEdges: EdgeData<void>[] = [];

    edges.forEach(it => {
      if (hiddenEdges.has(it.edgeId)) {
        return;
      }
      const fromPres = getPresentation(it.fromInjector);
      const toPres = getPresentation(it.toInjector);

      const edge = createEdge(it);

      if(fromPres === InjectorPresentation.FULL && it.fromInjector === it.toInjector) {
        edge.parent = `i${it.fromInjector}`
      }

      if (fromPres === InjectorPresentation.COLLPASED) {
        edge.from = `i${it.fromInjector}`
        edge.fromPort = undefined;
      }
      if (toPres === InjectorPresentation.COLLPASED) {
        edge.to = `i${it.toInjector}`
      }

      renderingEdges.push(edge);
    })

    setNodes(renderingNodes);
    setEdges(renderingEdges)

  }, [getPresentation, createEdge, createNode]);

  useEffect(() => {
    const sub = merge(dependencyModel!.$update, injectorModel!.$update).pipe(debounceTime(200)).subscribe(it => {
      refreshGraph();
    })
    return () => {
      sub.unsubscribe();
    }
  }, [refreshGraph])

  useEffect(() => {
    refreshGraph();
  }, [injectorPresentation, refreshGraph])



  return <TransformWrapper
    limitToBounds={false}
  >
    <TransformComponent>
      <Canvas
        zoomable={false}
        direction={'DOWN'}
        layoutOptions={{
          'nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'elk.layered.mergeHierarchyEdges': 'false',
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
          'partitioning.activate': 'true',
          'spacing': '25',
          'spacing.nodeNodeBetweenLayers': '30',
          'spacing.edgeNodeBetweenLayers': '10',
          'spacing.componentComponent': '20',
        }}
        animated={true}
        fit={false}
        pannable={false}
        nodes={nodes}
        edges={edges}
        node={nodeRender}
        edge={edgeRender as any}
      />
    </TransformComponent>
  </TransformWrapper>
}


