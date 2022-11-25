import React from "react";
import { Label, Node, NodeProps } from "reaflow";
import { DependencyIdentifierData } from "~/common/types";
import { InjectorModel } from "../model/injector-model";
import { injecotrColor, nodeStyle } from "../utils/color-utils";
import { useListener, useModel } from "../utils/hooks";
import { NodeMetadata } from "./graph";


export function renderNode(injectorPalette: Map<number, string>, nodeProps: NodeProps) {
    const metadata = (nodeProps.properties.data || {}) as NodeMetadata;

    if (metadata.type === "injector") {
        const injectorId = metadata.injectorId;
        const color = injecotrColor(injectorPalette, injectorId)
        if (metadata.hasChildren) {
            return (
                <Node
                    style={{
                        stroke: color,
                        fill: 'white',
                        strokeWidth: 1,
                    }}
                    linkable={false}
                >
                    <g style={{transform: 'translate(10px, 18px)'}}>
                        <title>{metadata.injectorName}</title>
                        <text style={{ fill: color, fontSize: '16px' }}>{metadata.injectorName}</text>
                    </g>
                </Node>
            )
        }
        return <Node
            linkable={false}
            style={{
                fill: color,
                strokeWidth: 2,
                opacity: 0.6
            }}
            label={<Label style={{ fill: 'black' }} />}
        />
    }

    const style = nodeStyle(injectorPalette, metadata);

    return <Node
        linkable={false}
        style={{
            ...style
        }}
        label={<Label style={{ fill: 'black' }} />}
    />

}