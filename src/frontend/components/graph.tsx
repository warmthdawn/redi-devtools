import React from 'react';
import { Canvas, NodeData, EdgeData, Node, NodeProps, Label } from 'reaflow';
import { DependencyEdge, DependencyItemData, DependencyData, InjectorResponse } from '~/common/types';
import { injectorPaletteFor } from '../utils/color-utils';
import { NodeRouter } from './node-router';

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import './graph.css'

interface DependencyGraphProps {
  dependencies: DependencyData[]
  injectors: InjectorResponse,
  presentation: Map<number, InjectorPresentation>
}

export enum InjectorPresentation {
  /**
   * 完全隐藏 Injector 和它所包含的 Dependency、子 Injector
   */
  HIDDEN,
  /**
   * 将Injector只显示为一个节点
   */
  COLLPASED,
  /**
   * 只显示 Injector 中被依赖的节点
   */
  EXTERNALIZED,
  /**
   * 只显示被依赖的节点，分组展示，不限显示内部关系
   */
  GROUPED,
  /**
   * 完全展开节点
   */
  EXPANDED,
}

export function DependencyGraph(props: DependencyGraphProps) {

  const { dependencies, injectors, presentation } = props;



function createNode(dep: DependencyItemData, depth: number): NodeData<any> {
  const id = `n${dep.nodeId}`;
  const text = dep.name;
  return {
    id,
    text,
    layoutOptions: {
      'partitioning.partition': depth.toString(),
    } as any,
  }
}

function createEdge(dep: DependencyEdge): EdgeData<DependencyEdge> {
  const id = `e${dep.fromNode}-${dep.toNode}`;

  const fromPort = typeof dep.fromPort === 'undefined' ? undefined : `p${dep.fromNode.injectorId}-${dep.toNode.id}#${dep.fromPort}`

  return {
    id,
    from: `n${dep.fromNode.id}`,
    to: `n${dep.toNode.id}`,
    fromPort,
    data: dep
  }
}


  const injectorDepthMap = new Map(
    injectors.injectors
      .map(it => [it.injectorId, injectors.maxDepth - it.depth + 1])
  );

  const nodeDataMap = new Map(dependencies.map(it => [`n${it.item.nodeId}`, it.item]))

  const nodes = dependencies.map(it => {
    const depth = injectorDepthMap.get(it.item.injectorId) || 0
    return createNode(it.item, depth);
  })

  const edges = dependencies.flatMap(it => it.startingEdges.map(edge => createEdge(edge)));


  const injectorPalette = injectorPaletteFor(injectors.injectors);
  const Node = (nodeProps: NodeProps) => {
    return (
      <NodeRouter
        nodeProps={nodeProps}
        nodeDatas={nodeDataMap}
        injectorPalette={injectorPalette}
      />
    );
  };

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
          'partitioning.activate': 'true',
          'spacing': '25',
          'spacing.nodeNodeBetweenLayers': '30',
          'spacing.edgeNodeBetweenLayers': '10',
          'spacing.componentComponent': '20',
        }}
        fit={false}
        pannable={false}
        nodes={nodes}
        edges={edges}
        node={Node}
      />
    </TransformComponent>
  </TransformWrapper>
}


