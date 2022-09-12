import React, { Children, useMemo, useState } from "react"
import "./injector-tree.css"


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

export interface InjectorNode {
    id: string,
    name: string,
    children?: InjectorNode[]
}


export const InjectorTree: React.FC<{ roots: InjectorNode[] }> = (props) => {

    const [expandedKeys, updateExpandedKeys] = useState<Set<string>>(new Set())


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
                {props.roots.map(it => (
                    <InjectorTreeNode node={it} isExpand={(id) => expandedKeys.has(id)} onClick={toggleExpand} />
                ))}

            </ul>
        </div>
    )

}

export interface InjectorTreeNodeProps {
    node: InjectorNode
    isExpand(id: string): boolean,
    depth?: number
    onClick(node: InjectorNode): void
}

export const InjectorTreeNode: React.FC<InjectorTreeNodeProps> = (props) => {

    const { node, isExpand, onClick: onExpand } = props;

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
                        <span className="title">{node.name}</span>
                    </div>
                </div>
            </li>
        </React.Fragment>
        {
            expanded && node.children?.map(it => (
                <InjectorTreeNode node={it} depth={depth + 1} isExpand={isExpand} onClick={onExpand} />
            ))
        }
    </>
}