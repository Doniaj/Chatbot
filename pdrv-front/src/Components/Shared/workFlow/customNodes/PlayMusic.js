import React from "react";
import { Handle, useReactFlow, useStore } from "reactflow";
import { PlayCircle, Trash2 } from "lucide-react";
import "./nodeStyle.css";

const PlayMusic = ({ id }) => {
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
        <div className={`play-music-node ${isSelected ? "selected" : ""}`}>
            <div className="play-music-header">
                <PlayCircle size={24} style={{ marginRight: "5px" }} />
                <span>{label || "Play Music"}</span>
                <button className="delete-icon" onClick={handleDelete}>
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="play-music-content">
                {repetitions !== undefined && (
                    <div><strong>Repetitions:</strong> {repetitions}</div>
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

            {/* Conditionally render handles based on node type */}
            {node?.node_type !== "output" && (
                <Handle type="source" position="bottom" className="play-music-handle" />
            )}
            {node?.node_type !== "input" && (
                <Handle type="target" position="top" className="play-music-handle" />
            )}
        </div>
    );
};

export default PlayMusic;