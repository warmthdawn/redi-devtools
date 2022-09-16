import React, { Children, useMemo, useState } from "react"
import { InjectorNode, InjectorPresentation } from "../model/injector-model"
import { useListener, useModel } from "../utils/hooks"
import "./injector-tree.css"


export const InjectorTree: React.FC<{ injectorPresentation: Map<number, InjectorPresentation>, updatePresentation: (id: number, presentation: InjectorPresentation) => void }> = (props) => {

    const [expandedKeys, updateExpandedKeys] = useState<Set<number>>(new Set())

    const { injectorModel } = useModel();

    useListener(injectorModel!.$update.asObservable())

    const toggleExpand = (node: InjectorNode, state?: boolean) => {
        updateExpandedKeys(oldData => {
            if (typeof state === "undefined") {
                state = !oldData.has(node.id)
            } else if (state == oldData.has(node.id)) {
                return oldData;
            }
            const newData = new Set(oldData);
            if (state) {
                newData.add(node.id);
            } else {
                newData.delete(node.id);
            }
            return newData
        });
    }


    return (
        <div className="injector-tree-container">
            <ul className="injector-tree">
                {injectorModel!.getTree().map(it => (
                    <InjectorTreeNode
                        node={it}
                        isExpand={(id) => expandedKeys.has(id)}
                        onClick={(id) => {
                            let current = props.injectorPresentation.get(id.id);
                            if (typeof current === "undefined") {
                                current = InjectorPresentation.EXPANDED;
                            }
                            props.updatePresentation(id.id, (current + 1) % 5)
                        }}
                        presentation={props.injectorPresentation}
                        onExpand={toggleExpand}
                    />
                ))}

            </ul>
        </div>
    )

}

export interface InjectorTreeNodeProps {
    node: InjectorNode
    isExpand(id: number): boolean,
    depth?: number
    presentation: Map<number, InjectorPresentation>,
    onExpand(node: InjectorNode): void
    onClick(node: InjectorNode): void
}

export const InjectorTreeNode: React.FC<InjectorTreeNodeProps> = (props) => {

    const { node, isExpand, onClick, onExpand, presentation } = props;

    const depth = props.depth || 0;
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isExpand(node.id)

    return <>
        <React.Fragment key={node.id}>
            <li >
                <div className={"injector-tree-item-wrapper"}>
                    <div
                        className="injector-tree-item"
                        style={{ paddingLeft: depth! * 22 + 6 }}
                    >
                        <span className="expand"
                            onClick={() => onExpand(node)}>{hasChildren ? (expanded ? "-" : "+") : " "}</span>
                        <span className="title" onClick={() => onClick(node)}>{node.name}[{presentation.get(node.id)}]</span>
                    </div>
                </div>
            </li>
        </React.Fragment>
        {
            expanded && node.children?.map(it => (
                <InjectorTreeNode node={it} depth={depth + 1} isExpand={isExpand} onClick={onClick} onExpand={onExpand} presentation={presentation} />
            ))
        }
    </>
}