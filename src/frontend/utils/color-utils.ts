import { DependencyIdentifierData, InjectorData } from "~/common/types";
import distinctColors from "distinct-colors";
import { InjectorNode } from "../model/injector-model";
import { DependencyNode } from "../model/dependency-model";
import { DepNodeMetadata } from "../components/graph";

export function nodeStyle(palette: Map<number, string>, meta?: DepNodeMetadata) {
    const injectorColor = (meta && palette.get(meta?.injectorId)) || defaultColor;

    return {
        stroke: injectorColor,
        fill: 'white', // TODO
        strokeWidth: 2,
    }
}


export function injecotrColor(palette: Map<number, string>, injectorId: number) {
   return palette.get(injectorId) || defaultColor;
}

const defaultColor = "#444";
let palette: string[] = [];


function regeneratePalette(max: number) {
    const count = Math.max(5, max);
    if (count === palette.length) {
        return palette;
    }
    palette = distinctColors({
        count: count,
        chromaMin: 15,
        chromaMax: 40,
        lightMin: 40,
        lightMax: 70,
        samples: 800,
    }).map(it => it.css())

    return palette;
}


export function injectorPaletteFor(injectors: InjectorNode[]): Map<number, string> {
    const size = injectors.length;
    const palette = regeneratePalette(size);

    return new Map(injectors.map(({ id }, index) => [id, palette[index]]))
}
