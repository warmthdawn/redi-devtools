import { DependencyItemData, InjectorData } from "~/common/types";
import distinctColors from "distinct-colors";

export function nodeStyle(palette: Map<number, string>, node?: DependencyItemData) {
    const injectorColor = (node && palette.get(node?.injectorId)) || defaultColor;

    return {
        stroke: injectorColor,
        fill: 'white', // TODO
        strokeWidth: 2,
    }
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


export function injectorPaletteFor(injectors: InjectorData[]): Map<number, string> {
    const size = injectors.length;
    const palette = regeneratePalette(size);

    return new Map(injectors.map(({ injectorId }, index) => [injectorId, palette[index]]))
}
