import React from "react";
import { Handle, useReactFlow, useStore } from "reactflow";
import "./nodeStyle.css";
import { Trash2 } from "lucide-react";

const DefaultNode = ({ id }) => {
    const { getNode, setNodes, setEdges } = useReactFlow();
    const node = getNode(id);

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    };

    const isSelected = useStore((store) => {
        const selectedNodes = Array.from(store.nodeInternals.values()).filter((n) => n.selected);
        return selectedNodes.some((n) => n.id === id);
    });

    return (
        <div className={`node ${isSelected ? "selected" : ""}`} style={{ backgroundColor: "lightgray" }}>
            <button onClick={handleDelete} className="delete-icon">
                <Trash2 size={16} />
            </button>
            <div>{node?.data?.label || "No label"}</div>

            {node?.node_type !== "output" && (
                <Handle type="source" position="bottom" className="handle" />
            )}
            {node?.node_type !== "input" && (
                <Handle type="target" position="top" className="handle" />
            )}
        </div>
    );
};

export default DefaultNode;
