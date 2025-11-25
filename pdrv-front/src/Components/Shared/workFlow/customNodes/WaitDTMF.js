import React from "react";
import { Handle, useReactFlow, useStore } from "reactflow";
import { PhoneIncoming, Trash2 } from "lucide-react";
import "./nodeStyle.css";

const WaitDTMF = ({ id }) => {
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
        <div className={`wait-dtmf-node ${isSelected ? "selected" : ""}`}>
            <div className="wait-dtmf-header">
                <PhoneIncoming size={18} className="icon-dtmf" />
                <span className="node-title">{data.label || "Wait DTMF"}</span>
                <button onClick={handleDelete} className="delete-icon">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="wait-dtmf-body">


                <div className="details-line">
                    <span>Timeout No Input: {data.timeoutNoInput || 0}</span>
                    <span>Inter-digit: {data.timeoutInterDigit || 0}</span>
                </div>

                <div className="details-line">
                    <span>Retry Max: {data.retryMax || 0}</span>
                    <span>Input Term: {data.inputTerm || "-"}</span>
                </div>

                {(data.inputMin !== undefined || data.inputMax !== undefined) && (
                    <div className="details-line">
                        <span>Input Length: {data.inputMin || 0} - {data.inputMax || 0}</span>
                    </div>
                )}

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
                <Handle type="source" position="bottom" className="wait-dtmf-handle" />
            )}
            {node?.node_type !== "input" && (
                <Handle type="target" position="top" className="wait-dtmf-handle" />
            )}
        </div>
    );
};

export default WaitDTMF;
