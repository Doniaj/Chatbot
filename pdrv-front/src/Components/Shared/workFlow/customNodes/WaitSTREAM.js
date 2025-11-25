import React from "react";
import { Handle, useReactFlow, useStore } from "reactflow";
import { Clock, Trash2 } from "lucide-react";
import "./nodeStyle.css";

const WaitSTREAM = ({ id }) => {
    const { getNode, setNodes, setEdges } = useReactFlow();
    const node = getNode(id);
    const data = node?.data || {};
    const { label, repetitions, contentType, script, audioFile } = data;

    const isSelected = useStore((store) => {
        const selectedNodes = Array.from(store.nodeInternals.values()).filter((n) => n.selected);
        return selectedNodes.some((n) => n.id === id);
    });

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    };

    return (
        <div className={`wait-stream-node ${isSelected ? "selected" : ""}`}>
            <div className="wait-stream-header">
                <Clock size={18} className="icon-clock" />
                <span className="node-title">{data.label || "Wait Stream (Input)"}</span>
                <button onClick={handleDelete} className="delete-icon">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="wait-stream-body">
                <div className="details-line">
                    <span>timeout: {data.timeoutStream || 0}</span>
                    <span>limit: {data.limit || 0}</span>
                </div>

                {data.audioFile && (!data.contentType || data.contentType === "audio") ? (
                    <div className="audio-file">
                        🎵 Audio
                    </div>
                ) : script && (data.contentType === "script") ? (
                    <div className="script-content">
                        📝 <span>{script.length > 20 ? `${script.substring(0, 20)}...` : script}</span>
                    </div>
                ) : (
                    <p className="description">Aucun contenu</p>
                )}

            </div>

            {node?.node_type !== "output" && (
                <Handle type="source" position="bottom" className="wait-stream-handle" />
            )}
            {node?.node_type !== "input" && (
                <Handle type="target" position="top" className="wait-stream-handle" />
            )}
        </div>
    );
};

export default WaitSTREAM;
