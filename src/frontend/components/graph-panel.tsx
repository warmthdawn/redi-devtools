import { useCallback, useMemo } from "react";
import { Edge, NodeProps } from "reaflow";
import { InjectorPresentation } from "../model/injector-model";
import { injectorPaletteFor } from "../utils/color-utils";
import { useListener, useModel } from "../utils/hooks";
import { DependencyGraph } from "./graph";
import { renderNode } from "./node-router";


export interface GraphPanelProps {
    injectorPresentation: Map<number, InjectorPresentation>
}


export const GraphPanel: React.FC<GraphPanelProps> = (props) => {
    const { injectorModel } = useModel();
    useListener(injectorModel!.$update.asObservable())


    const injectors = injectorModel!.getInjectors();

    const injectorPalette = useMemo(() => injectorPaletteFor(injectors), [injectors.length]);
    const Node = useCallback((nodeProps: NodeProps) => renderNode(injectorPalette, nodeProps), [injectorPalette]);

    return (
        <DependencyGraph
            injectorPresentation={props.injectorPresentation}
            nodeRender={Node}
            edgeRender={(props) => (<Edge{...props} />)}
        />
    );
}