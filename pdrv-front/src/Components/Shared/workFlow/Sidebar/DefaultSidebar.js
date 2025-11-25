import React from "react";
import PlayMusic from "../customNodes/PlayMusic";
import WaitDTMF from "../customNodes/WaitDTMF";
import WaitSTREAM from "../customNodes/WaitSTREAM";
import DefaultNode from "../customNodes/DefaultNode";
import "./sidebar.css";
import { useSelector } from "react-redux";

const DefaultSidebar = () => {
    const { topbarThemeType } = useSelector((state) => ({
        topbarThemeType: state.Layout.topbarThemeType,
    }));

    const nodeTypes = {
        playMusic: { component: PlayMusic, label: "Play Music", color: "#045dc3" },
        waitDTMF: { component: WaitDTMF, label: "Wait DTMF", color: "#98C2FFCC" },
        waitSTREAM: { component: WaitSTREAM, label: "Wait STREAM", color: "#5499FFCC" },
        defaultNode: { component: DefaultNode, label: "Default Node", color: "rgba(200,200,200,0.8)" },
    };

    const onDragStart = (event, nodeType) => {
        const nodeData = JSON.stringify({ type: nodeType, label: nodeTypes[nodeType].label });
        event.dataTransfer.setData("application/reactflow", nodeData);
        event.dataTransfer.effectAllowed = "move";
    };


    const sidebarThemeClass = topbarThemeType === "dark" ? "sidebar-dark" : "sidebar-light";

    return (
        <div className={`sidebar-container ${sidebarThemeClass}`}>
            <h3   className="sidebar-tools">🛠️ Node Tools</h3>
            {Object.keys(nodeTypes).map((nodeType) => (
                <div
                    key={nodeType}
                    className="draggable-node"
                    style={{ backgroundColor: nodeTypes[nodeType].color }}
                    draggable
                    onDragStart={(event) => onDragStart(event, nodeType)}
                >
                    {nodeTypes[nodeType].label}
                </div>
            ))}
        </div>
    );
};

export default DefaultSidebar;
