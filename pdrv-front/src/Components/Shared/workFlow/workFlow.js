import React, {useState, useCallback, useEffect} from "react";
import ReactFlow, {
    Background,
    Controls,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MiniMap,
    ReactFlowProvider,
    getStraightPath,
} from "reactflow";
import "reactflow/dist/style.css";
import "./Sidebar/sidebar.css";
import {useLocation} from "react-router-dom";
import DefaultSidebar from "./Sidebar/DefaultSidebar";
import WaitDTMFSidebar from "./Sidebar/WaitDTMFSidebar";
import PlayMusicSidebar from "./Sidebar/PlayMusicSidebar";
import WaitSTREAMSidebar from "./Sidebar/WaitSTREAMSidebar";
import PlayMusic from "./customNodes/PlayMusic";
import WaitDTMF from "./customNodes/WaitDTMF";
import WaitSTREAM from "./customNodes/WaitSTREAM";
import DefaultNode from "./customNodes/DefaultNode";
import {v4 as uuidv4} from "uuid";
import DefaultNodeSidebar from "./Sidebar/DefaultNodeSidebar";
import workflowApiService from "../../../util/services/WorkFlowApiService";
import {GetUserInfo} from "../../../helpers/stringHelper";
import {dangerAlert, successAlert} from "../../../slices/alerts/thunk";
import {useDispatch, useSelector} from "react-redux";
import {isInteger} from "formik";
import {useShortCutNode} from "./customNodes/useShortCutNode";
import {USER_ROLE} from "../../../Common/constants";
import LayoutModeDropdown from "../../../Common/LayoutModeDropdown";
import ConfirmModal from "../../../util/modals/ConfirmModal";
import { useTranslation } from "react-i18next";
import moment from "moment/moment";
import {NotifySuccess} from "../../../Common/Toast";
import {NotifyError} from "../../../util/alerte_extensions/AlertsComponents";
const nodeTypes = {
    waitDTMF: WaitDTMF,
    waitSTREAM: WaitSTREAM,
    playMusic: PlayMusic,
    defaultNode: DefaultNode,
};

const initialNodes = [
    {
        id: uuidv4(),
        node_type: 'input',
        type: "waitSTREAM",
        data: {label: "Wait Stream (Input)"},
        position: {x: 250, y: 0},
    },
    {
        id: uuidv4(),
        node_type: 'default',
        type: "waitDTMF",
        data: {label: "Wait DTMF (Chauffage)"},
        position: {x: 250, y: 150},
    },
    {
        id: uuidv4(),
        node_type: 'output',
        type: "playMusic",
        data: {label: "Play Music (Output)"},
        position: {x: 250, y: 300},
    },
];

const initialEdges = [
    {id: 'e1-2', source: initialNodes[0].id, target: initialNodes[1].id, animated: true},
    {id: 'e2-3', source: initialNodes[1].id, target: initialNodes[2].id, animated: true},
];

const Workflow = ({role}) => {
    const { t } = useTranslation();
    const location = useLocation();
    const adminData = location.state?.user;
    const isAdminWorkflow = role === USER_ROLE.ADMIN;
    const [blockWorkFlowAction, setBlockWorkFlowAction] = useState(false);

    const currentUser = GetUserInfo();
    const [toggleModalDelete, setToggleModalDelete] = useState(false);
    const [dataModalDelete, setDataModalDelete] = useState(null);

    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [edgePosition, setEdgePosition] = useState(null);
    const [isDefaultBrowser, setIsDefaultBrowser] = useState(true);
    const [isDisabled, setIsDisabled] = useState(false);
    const [hasExistingWorkflow, setHasExistingWorkflow] = useState(false);
    const dispatch = useDispatch();

    const [workflowId, setWorkflowId] = useState(null);

    const fetchWorkflows = () => {
        const user_id = isAdminWorkflow ? currentUser?.user_id : adminData?.user_id;

        workflowApiService.getWorkflowsByUserId(user_id).then((response) => {
            if (response?.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                const sortedWorkflows = response.data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const latestWorkflow = sortedWorkflows[0];

                if (latestWorkflow?.react_flow?.nodes?.length > 0) {
                    setWorkflowId(latestWorkflow.id);
                    setNodes(latestWorkflow.react_flow.nodes);
                    setEdges(latestWorkflow.react_flow.edges || []);
                    setHasExistingWorkflow(true);
                } else {
                    setNodes(initialNodes);
                    setEdges(initialEdges);
                    setHasExistingWorkflow(false);
                    dispatch(dangerAlert("No nodes in workflow, using initial nodes"));
                }
            } else {
                setNodes(initialNodes);
                setEdges(initialEdges);
                setHasExistingWorkflow(false);
            }
        }).catch(error => {
            dispatch(dangerAlert("cannot get workflow"));
            setNodes(initialNodes);
            setEdges(initialEdges);
            setHasExistingWorkflow(false);
        });
    };

    useEffect(() => {
        console.table(nodes);
    }, [nodes]);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const onNodesChange = useCallback(
        (changes) => {
            setNodes((nds) => applyNodeChanges(changes, nds));
        },
        []
    );

    const onEdgesChange = useCallback(
        (changes) => {
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        []
    );

    const onConnect = useCallback((connection) => {
        setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    }, []);

    const handleNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const handleEdgeClick = (event, edge) => {
        setSelectedEdge(edge);
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);

        if (sourceNode && targetNode) {
            const [, labelX, labelY] = getStraightPath({
                sourceX: sourceNode.position.x + 200,
                sourceY: sourceNode.position.y + 150,
                targetX: targetNode.position.x + 200,
                targetY: targetNode.position.y + 250,
            });

            setEdgePosition({ x: labelX, y: labelY });
        }
    };

    const duplicateNode = () => {
        const selectedNodes = nodes.filter(n => n.selected && n.node_type !== "input");
        if (selectedNodes.length > 0) {
            const _id = uuidv4();
            setNodes(prevNodes => prevNodes.map(n => ({ ...n, selected: false })));

            setNodes(prevNodes => [
                ...prevNodes,
                {
                    ...selectedNodes[0],
                    id: _id,
                    data: { ...selectedNodes[0].data, id: _id },
                    position: {
                        x: selectedNodes[0].position.x + 50,
                        y: selectedNodes[0].position.y + 50,
                    },
                    selected: false
                }
            ]);
        }
    };
    useShortCutNode("duplicate", duplicateNode);

    const goBackToDefault = () => {
        setSelectedNode(null);
        setNodes(prevNodes => prevNodes.map(node => ({ ...node, selected: false })));
    };

    const handleDeleteEdge = useCallback((deletedEdges) => {
        setEdges((eds) => eds.filter(edge => !deletedEdges.some(de => de.id === edge.id)));
        setSelectedEdge(null);
    }, []);

    const renderSidebar = () => {
        if (!selectedNode || !selectedNode.type) {
            return <DefaultSidebar nodes={nodes} setNodes={setNodes} />;
        }

        switch (selectedNode.type.trim().toLowerCase()) {
            case "waitstream":
                return <WaitSTREAMSidebar selectedNode={selectedNode} setNodes={setNodes} goBackToDefault={goBackToDefault} />;
            case "play music (hangup)":
                return <PlayMusicSidebar selectedNode={selectedNode} setNodes={setNodes} goBackToDefault={goBackToDefault} />;
            case "waitdtmf":
                return <WaitDTMFSidebar selectedNode={selectedNode} setNodes={setNodes} goBackToDefault={goBackToDefault} />;
            case "playmusic":
                return <PlayMusicSidebar selectedNode={selectedNode} setNodes={setNodes} goBackToDefault={goBackToDefault} />;
            case "defaultnode":
                return <DefaultNodeSidebar selectedNode={selectedNode} setNodes={setNodes} goBackToDefault={goBackToDefault} />;
            default:
                return <DefaultSidebar nodes={nodes} setNodes={setNodes} />;
        }
    };

    const countNodesEdgesCheckEmpty = async () => {
        const checkEmpty = nodes.filter(n =>
            ['playMusic', 'waitDTMF', 'waitSTREAM', "defaultNode"].includes(n?.type)
        ).filter(n => (n?.data?.label || "").trim() === "");

        if (checkEmpty.length !== 0) {
            return { count: true, empty: true };
        }
        const outputNodes = nodes.filter(n => n.node_type === 'output');
        if (outputNodes.length === 0) {
            return { count: false, empty: false, message: "Le schéma doit se terminer par un nœud output." };
        }

        const isSimpleStructure = nodes.length === 2 &&
            nodes.some(n => n.node_type === 'input') &&
            nodes.some(n => n.node_type === 'output');

        if (isSimpleStructure) {
            const inputNode = nodes.find(n => n.node_type === 'input');
            const outputNode = nodes.find(n => n.node_type === 'output');
            const connected = edges.some(e => e.source === inputNode.id && e.target === outputNode.id);
            if (!connected) {
                return {
                    count: false,
                    empty: false,
                    message: "L'input doit être connecté à l'output."
                };
            }

            return { count: true, empty: false };
        }

        for (const node of nodes) {
            const { id, node_type } = node;

            if (node_type === 'input' && !edges.some(e => e.source === id)) {
                return { count: false, empty: false, message: "L'input doit être connecté à au moins un nœud." };
            }

            if (node_type === 'output' && !edges.some(e => e.target === id)) {
                return { count: false, empty: false, message: "Le nœud output doit avoir une connexion entrante." };
            }

            if (node_type !== 'input' && node_type !== 'output') {
                const connected = edges.some(e => e.source === id || e.target === id);
                if (!connected) {
                    return {
                        count: false,
                        empty: false,
                        message: `Le nœud "${node.data?.label || node.id}" n'est connecté à rien.`
                    };
                }
            }
        }
        const visited = new Set();

        const dfs = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const nextNodes = edges
                .filter(e => e.source === nodeId)
                .map(e => e.target);

            nextNodes.forEach(dfs);
        };

        const inputNode = nodes.find(n => n.node_type === 'input');
        if (inputNode) {
            dfs(inputNode.id);
        }

        const outputReachable = outputNodes.some(n => visited.has(n.id));
        if (!outputReachable) {
            return {
                count: false,
                empty: false,
                message: "Aucun chemin ne mène à un nœud output."
            };
        }

        return { count: true, empty: false };
    };

    const handleSaveOrUpdateWorkflow = async () => {
        if (nodes.length === 0) {
            dispatch(dangerAlert("Erreur : Aucun nœud à sauvegarder !"));
            return;
        }

        const checkResult = await countNodesEdgesCheckEmpty();
        if (!checkResult.count) {
            dispatch(dangerAlert("Erreur : Certains nœuds ne sont pas correctement connectés."));
            return;
        }

        if (checkResult.empty) {
            dispatch(dangerAlert("Erreur : Certains nœuds ont un label vide."));
            return;
        }

        const user_id = isAdminWorkflow ? currentUser?.user_id : adminData.user_id;

        setIsDisabled(true);

        const audioNodes = nodes.filter(n => n?.data?.audioFile || n?.data?.script);

        const uploadPromises = audioNodes.map(async (audio) => {
            let generatedVoice = audio?.data?.generate?.generated_voice;

            if (generatedVoice) {
                return { ...audio, data: { ...audio.data, audioFile: generatedVoice } };
            }

            const script = audio?.data?.script;
            const audioFile = audio?.data?.audioFile;

            try {
                // 🎙️ Cas du script texte
                if (script && typeof script === "string") {
                    const result = await workflowApiService.texttospeech(script);
                    const file_id = result?.data?.efile_id;
                    if (file_id) {
                        generatedVoice = file_id;
                        audio.data.generate = {
                            ...audio.data.generate,
                            generated_voice: file_id,
                        };
                        return { ...audio, data: { ...audio.data, audioFile: file_id } };
                    } else {
                        dispatch(dangerAlert("Échec de la génération vocale via script."));
                        return null;
                    }
                }

                // 🎧 Cas du fichier audio
                if (audioFile && !isInteger(audioFile)) {
                    const allowedMimeTypes = ['audio/mpeg', 'audio/wav'];
                    const maxFileSize = 20000000;

                    if (!allowedMimeTypes.includes(audioFile.type)) {
                        dispatch(dangerAlert("Erreur : Le fichier audio doit être au format MP3 ou WAV."));
                        return null;
                    }

                    if (audioFile.size > maxFileSize) {
                        dispatch(dangerAlert("Erreur : Le fichier audio dépasse la taille autorisée."));
                        return null;
                    }

                    const formData = new FormData();
                    formData.append("file", audioFile);

                    const result = await workflowApiService.uploadAudio(formData);
                    const efileData = result?.data?.data;

                    if (efileData?.file_id) {
                        generatedVoice = efileData.file_id;
                        audio.data.generate = {
                            ...audio.data.generate,
                            generated_voice: generatedVoice,
                        };
                        return { ...audio, data: { ...audio.data, audioFile: generatedVoice } };
                    } else {
                        dispatch(dangerAlert("Le fichier n'a pas pu être téléchargé."));
                        return null;
                    }
                }

                dispatch(dangerAlert("Le nœud ne contient ni script valide ni fichier audio."));
                return null;

            } catch (error) {
                dispatch(dangerAlert("Une erreur est survenue pendant le traitement audio."));
                return null;
            }
        });

        const uploadedAudioNodes = (await Promise.all(uploadPromises)).filter(Boolean);

        if (uploadedAudioNodes.length !== audioNodes.length) {
            setIsDisabled(false);
            return;
        }

        const updatedNodes = nodes.map(node => {
            const uploadedNode = uploadedAudioNodes.find(n => n.id === node.id);
            return uploadedNode ? uploadedNode : node;
        });

        const workflowData = {
            id: workflowId,
            user_id,
            name: hasExistingWorkflow ? "Workflow Mis à Jour" : "Nouveau Workflow",
            description: hasExistingWorkflow ? "Description mise à jour" : "Description du workflow",
            react_flow: {
                nodes: updatedNodes.map(({ id, node_type, type, data, position, createdAt, updatedAt }) => ({
                    id,
                    node_type,
                    type,
                    data: { ...data, file_id: data?.file_id },
                    position,
                    createdAt: createdAt || new Date().toISOString(),
                    updatedAt: updatedAt || new Date().toISOString(),
                })),
                edges,
            },
            active: 'Y',
            status: 'Y',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        let saveResponse;
        if (hasExistingWorkflow) {
            saveResponse = await workflowApiService.update(workflowData);
        } else {
            saveResponse = await workflowApiService.save(workflowData);
        }

        if (saveResponse?.status === 200) {
            dispatch(successAlert(hasExistingWorkflow ? "Workflow mis à jour avec succès" : "Workflow sauvegardé avec succès"));
        } else {
            dispatch(dangerAlert("Une erreur s'est produite. Veuillez réessayer."));
        }

        setIsDisabled(false);
    };

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const data = JSON.parse(event.dataTransfer.getData("application/reactflow"));
            if (!data?.type) {
                return;
            }

            const { clientX, clientY } = event;

            const flowBounds = document.getElementById("reactflow-container")?.getBoundingClientRect();
            if (!flowBounds) return;

            const position = {
                x: clientX - flowBounds.left,
                y: clientY - flowBounds.top,
            };

            const newNode = {
                id: uuidv4(),
                type: data.type,
                position: position,
                data: { label: `${data.label || data.type}` },
            };

            setNodes((nds) => [...nds, newNode]);
        },
        [setNodes]
    );

    const { topbarThemeType } = useSelector((state) => ({
        topbarThemeType: state.Layout.topbarThemeType,
    }));

    const themeClass = topbarThemeType === "dark" ? "sidebar-dark" : "sidebar-light";

    const confirmDeleteWorkFlow = () => {
        // Make sure we're using the workflowId for deletion
        const idToDelete = workflowId;

        if (!idToDelete) {
            console.error("No workflow ID to delete");
            NotifyError(t('no-workflow-id'));
            setToggleModalDelete(false);
            return;
        }

        console.log("Deleting workflow from database with ID:", idToDelete);

        // API call to delete the workflow from the database
        workflowApiService.deleteWorkflow(idToDelete)
            .then(response => {
                console.log("Database deletion response:", response);

                if (response?.data?.success || response?.status === 200) {
                    // Reset workflow state after successful deletion
                    setWorkflowId(null);
                    setNodes(initialNodes);
                    setEdges(initialEdges);
                    setHasExistingWorkflow(false);

                    setToggleModalDelete(false);
                    NotifySuccess(t('workFlow-deleted'));
                } else {
                    throw new Error("Failed to delete workflow from database");
                }
            })
            .catch(error => {
                console.error("Database deletion error:", error);
                NotifyError(t('fail-delete-database'));
                setToggleModalDelete(false);
            });
    };
    const cancelDeleteWorkFlow = () => {
        setToggleModalDelete(false);
        setDataModalDelete(null);
    };

    return (
        <div className={`page-content ${themeClass}`}>
            <ReactFlowProvider>
                <div className="flow-container">
                    <div className="sidebar">{renderSidebar()}</div>

                    <div className="workflow-main">
                        <div className="workflow-header">
                            <button
                                className="save_update"
                                onClick={handleSaveOrUpdateWorkflow}
                                disabled={isDisabled}
                            >
                                {hasExistingWorkflow ? "Update Workflow" : "Save Workflow"}
                            </button>

                            {hasExistingWorkflow && (
                                <button
                                    className="delete_workflow"
                                    onClick={() => setToggleModalDelete(true)}
                                    disabled={isDisabled}
                                >
                                    Delete Workflow
                                </button>
                            )}

                            {toggleModalDelete && (
                                <ConfirmModal
                                    handleModal={toggleModalDelete}
                                    onConfirm={confirmDeleteWorkFlow}
                                    onCancel={cancelDeleteWorkFlow}
                                />
                            )}
                        </div>

                        <div className="reactflow-container">
                            <ReactFlow
                                key={nodes.length}
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onDrop={onDrop}
                                onDragOver={(event) => event.preventDefault()}
                                id="reactflow-container"
                                onConnect={onConnect}
                                onNodeClick={handleNodeClick}
                                onEdgeClick={handleEdgeClick}
                                nodeTypes={nodeTypes}
                                fitView
                                onPaneClick={goBackToDefault}
                            >
                                <Background variant="dots" gap={10} size={1} />
                                <Controls />
                                <MiniMap />
                            </ReactFlow>
                        </div>
                    </div>
                </div>
            </ReactFlowProvider>
        </div>
    );
};


export default Workflow;