import React from "react";
import { Label, Node, NodeProps } from "reaflow";
import { DependencyItemData } from "~/common/types";
import { nodeStyle } from "../utils/color-utils";

interface NodeRouterProps {
    injectorPalette: Map<number, string>,
    nodeDatas: Map<string, DependencyItemData>,
    nodeProps: NodeProps,
}

export function NodeRouter(props: React.PropsWithoutRef<NodeRouterProps>) {
    const id = props.nodeProps.id;
    const data = props.nodeDatas.get(id);

    const style = nodeStyle(props.injectorPalette, data);

    const { children, ...nodeProps } = props.nodeProps;
    return (
        <Node
            {...nodeProps}
            linkable={false}
            style={{
                ...style
            }}
            label={<Label style={{ fill: 'black' }} />}
        />
    )
}