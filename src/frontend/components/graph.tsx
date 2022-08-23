import React from 'react';
import { Canvas, NodeData, EdgeData, Node } from 'reaflow';
import { DependencyEdge, DependencyNode, DependencyResponse } from '~/common/types';


interface DependencyGraphState {
}

interface DependencyGraphProps {
  dependencies: DependencyResponse[]
}

export class DependencyGraph extends React.Component<DependencyGraphProps, DependencyGraphState> {
  constructor(props: DependencyGraphProps) {
    super(props)
  }

  render(): React.ReactNode {

    const dependencies = this.props.dependencies;

    const nodes = dependencies.map(it => this.createNode(it.node));
    const edges = dependencies.flatMap(it => it.startingEdges.map(edge => this.createEdge(edge)));


    return <Canvas
      direction={'UP'}
      layoutOptions={{
        'nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'crossingMinimization.semiInteractive': 'true',

      }}
      fit={true}
      nodes={nodes}
      edges={edges}
      node={
        <Node linkable={false} />
      }
    />
  }


  createNode(dep: DependencyNode): NodeData<any> {
    const id = `n${dep.nodeId}`;
    const text = dep.name;
    return {
      id,
      text,
    }
  }

  createEdge(dep: DependencyEdge): EdgeData<DependencyEdge> {
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



}