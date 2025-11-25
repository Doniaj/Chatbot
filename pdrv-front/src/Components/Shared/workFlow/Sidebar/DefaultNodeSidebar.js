import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import {useDispatch, useSelector} from "react-redux";
import { dangerAlert } from "../../../../slices/alerts/thunk";

const DefaultNodeSidebar = ({ selectedNode, setNodes, goBackToDefault }) => {
    const [label, setLabel] = useState("");
    const [nodeType, setNodeType] = useState("default");
    const dispatch = useDispatch();

    // Met à jour les champs quand selectedNode change
    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data?.label || "");
            setNodeType(selectedNode.node_type || "default");
        }
    }, [selectedNode]);

    const handleSaveChanges = () => {
        if (!selectedNode) return;

        setNodes((prevNodes) => {
            const existingInputNode = prevNodes.find(node => node.node_type === "input");

            if (nodeType === "input" && existingInputNode && existingInputNode.id !== selectedNode.id) {
                dispatch(dangerAlert("Un nœud de type 'input' existe déjà. Veuillez en choisir un autre."));
                return prevNodes;
            }

            return prevNodes.map((node) =>
                node.id === selectedNode.id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label,
                        },
                        node_type: nodeType,
                    }
                    : node
            );
        });
    };
    const { topbarThemeType } = useSelector((state) => ({
        topbarThemeType: state.Layout.topbarThemeType,
    }));

    const themeClass = topbarThemeType === "dark" ? "sidebar-dark" : "sidebar-light";
    return (
        <div className={`sidebar-container ${themeClass}`}>
            <button onClick={goBackToDefault} className="button-back">
                <FaArrowLeft /> Retour
            </button>
            <h3  className="sidebar-tools">Default Node</h3>

            <div  className="form-group select-group">
                <label>Label:</label>
                <select value={label} onChange={(e) => setLabel(e.target.value)} className="form-input">
                    <option value="answer">answer</option>
                    <option value="unavailable-appointment">unavailable-appointment</option>
                    <option value="user-details">user-details</option>
                    <option value="proposition-chat">proposition-chat</option>
                    <option value="proposition-client">proposition-client</option>
                    <option value="available-appointment">available-appointment</option>
                </select>
            </div>

            <div className="form-group select-group">
                <label>Type de Nœud :</label>
                <select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value)}
                    className="form-input"
                >
                    <option value="default">Default</option>
                    <option value="input">Input</option>
                    <option value="output">Output</option>
                </select>
            </div>


            <div className="save-container">
                <button className="save-button" onClick={handleSaveChanges}>
                    Enregistrer les modifications
                </button>
            </div>
        </div>
    );
};

export default DefaultNodeSidebar;
