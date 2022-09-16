import React, { useCallback, useEffect, useState } from 'react';
import { Canvas, NodeData, EdgeData, Node, NodeProps, Label, EdgeProps, Edge } from 'reaflow';
import { DependencyRelation, DependencyItemData, DependencyData, InjectorResponse } from '~/common/types';
import { injectorPaletteFor } from '../utils/color-utils';
import { renderNode } from './node-router';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import './graph.css'
import { InjectorPresentation } from '../model/injector-model';
import { DependencyEdge, DependencyNode } from '../model/dependency-model';
import { useListener, useModel } from '../utils/hooks';

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
    if (depth) {
      return {
        id: node.nodeId,
        text: node.text,
        layoutOptions: {
          'partitioning.partition': depth,
        } as any,
        data: {
          injectorId: node.injectorId,
          type: 'dependency',
        }
      }
    }
    return {
      id: node.nodeId,
      text: node.text,
      data: {
        injectorId: node.injectorId,
        type: 'dependency',
      }
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
        if (getPresentation(it.fromInjector) !== InjectorPresentation.EXPANDED) {
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
      const depth = injectorModel!.getDepth(it.injectorId).toString();
      if (presentation === InjectorPresentation.EXPANDED) {
        renderingNodes.unshift(createNode(it, depth))
        return;
      }

      if (presentation === InjectorPresentation.EXTERNALIZED) {
        if (externalNodes.has(it.nodeId)) {
          renderingNodes.unshift(createNode(it, depth))
        }
        return;
      }

      if (presentation === InjectorPresentation.GROUPED) {
        const node = createNode(it);
        node.parent = `i${it.injectorId}`;
        rendeingInjectors.set(it.injectorId, true)
        renderingNodes.push(node)
      } else {
        rendeingInjectors.set(it.injectorId, false)
      }

    })

    rendeingInjectors.forEach((hasChildren, id) => {
      const injector = injectorModel!.getInjector(id)
      const depth = injectorModel!.getDepth(id).toString();
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
            'portConstraints': 'FREE'
          } as any,
          data,
        })
      } else {
        renderingNodes.push({
          id: `i${id}`,
          text: injector?.name || "Unknown",
          layoutOptions: {
            'partitioning.partition': depth || "0",
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

      if (fromPres === InjectorPresentation.COLLPASED) {
        edge.from = `i${it.fromInjector}`
      }
      if (toPres === InjectorPresentation.COLLPASED) {
        edge.to = `i${it.toInjector}`
      }

      renderingEdges.push(edge);
    })

    setNodes(renderingNodes);
    setEdges(renderingEdges)

  }, [injectorPresentation]);

  useEffect(() => {
    const sub1 = dependencyModel!.$update.subscribe(it => {
      refreshGraph();
    })
    const sub2 = injectorModel!.$update.subscribe(it => {
      refreshGraph();
    })
    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    }
  }, [])

  useEffect(() => {
    refreshGraph();
  }, [injectorPresentation])



  return <TransformWrapper
    limitToBounds={false}
  >
    <TransformComponent>
      <Canvas
        zoomable={false}
        direction={'DOWN'}
        layoutOptions={{
          'nodePlacement.strategy': 'NETWORK_SIMPLEX',
          'crossingMinimization.semiInteractive': 'true',
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


