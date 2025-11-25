import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import {useDispatch, useSelector} from "react-redux";
import {dangerAlert, successAlert} from "../../../../slices/alerts/thunk";
import workFlowApiService from "../../../../util/services/WorkFlowApiService";
import { Trash2, Volume2 } from "lucide-react";

const WaitDTMFSidebar = ({ selectedNode, setNodes, goBackToDefault }) => {
    const [label, setLabel] = useState("");
    const [contentType, setContentType] = useState("audio");
    const [script, setScript] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [audioFileUrl, setAudioFileUrl] = useState(null);
    const [scriptAudioUrl, setScriptAudioUrl] = useState(null);
    const [timeoutNoInput, setTimeoutNoInput] = useState(30);
    const [timeoutInterDigit, setTimeoutInterDigit] = useState(5);
    const [retryMax, setRetryMax] = useState(3);
    const [inputTerm, setInputTerm] = useState("");
    const [inputMin, setInputMin] = useState(1);
    const [inputMax, setInputMax] = useState(10);
    const [nodeType, setNodeType] = useState("default");
    const [changedGenerateAudio, setChangedGenerateAudio] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    const dispatch = useDispatch();
    const audioRef = useRef(null);
    const scriptAudioRef = useRef(null);

    useEffect(() => {
        if (selectedNode) {
            const { data = {}, node_type } = selectedNode;

            setLabel(data.label || "");
            setTimeoutNoInput(data.timeoutNoInput || 30);
            setTimeoutInterDigit(data.timeoutInterDigit || 5);
            setRetryMax(data.retryMax || 3);
            setInputTerm(data.inputTerm || "");
            setInputMin(data.inputMin || 1);
            setInputMax(data.inputMax || 10);
            setNodeType(node_type || "default");

            // Reset state for audio and script
            setAudioFile(null);
            setAudioFileUrl(null);
            setScript("");
            setScriptAudioUrl(null);

            // Determine content type and set accordingly
            if (data.contentType) {
                setContentType(data.contentType);

                if (data.contentType === "audio" && data.audioFile) {
                    setAudioFile(data.audioFile);
                    setAudioFileUrl(data.audioFileUrl || null);
                    playAudioMusic(data.audioFile);
                } else if (data.contentType === "script" && data.script) {
                    setScript(data.script);
                    setScriptAudioUrl(data.scriptAudioUrl || null);
                    if(data.audioFile){
                        playAudioMusic(data.audioFile);
                    }
                }
            }
        }
    }, [selectedNode]);

    const playAudioMusic = (fileId) => {
        if (!fileId) {
            dispatch(dangerAlert("ID de fichier audio manquant"));
            return;
        }

        const dataMusic = { file_id: fileId };
        workFlowApiService
            .playAudioMusic(dataMusic)
            .then((response) => {
                if (
                    response.data &&
                    response.data.success === false &&
                    response.data.messages
                ) {
                    throw new Error(response.data.messages.join(", "));
                }

                const blob = new Blob([response.data], { type: "audio/mpeg" });
                const audioUrl = URL.createObjectURL(blob);
                if(selectedNode?.data?.contentType === "audio") {
                    setAudioFileUrl(audioUrl);
                }else{
                    setScriptAudioUrl(audioUrl);
                }
            })
            .catch((error) => {
                dispatch(
                    dangerAlert(
                        "Impossible de lire le fichier audio: " + error.message
                    )
                );
            });
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            setAudioFileUrl(URL.createObjectURL(file));
            setContentType("audio");
            setScript("");
            setChangedGenerateAudio(true);
        }
    };

    const handleContentTypeChange = (type) => {
        setContentType(type);

        if (type === "audio") {
            setScript("");
            setScriptAudioUrl(null);
            if (!audioFile && !audioFileUrl && selectedNode?.data?.audioFile) {
                setAudioFile(selectedNode.data.audioFile);
                playAudioMusic(selectedNode.data.audioFile);
            }
        } else {
            if (!script && selectedNode?.data?.script) {
                setScript(selectedNode.data.script);
            }
            setAudioFile(null);
            setAudioFileUrl(null);
            setScriptAudioUrl(null);
        }
    };

    const generateAudioFromScript = async () => {
        if (!script) {
            dispatch(dangerAlert("Veuillez entrer un script avant de générer l'audio"));
            return;
        }

        setIsGeneratingAudio(true);
        try {
            const result = await workFlowApiService.texttospeech(script);
            const fileId = result?.data?.efile_id;

            if (fileId) {
                // Lire le fichier audio généré
                const dataMusic = { file_id: fileId };
                const response = await workFlowApiService.playAudioMusic(dataMusic);

                const blob = new Blob([response.data], { type: "audio/mpeg" });
                const audioUrl = URL.createObjectURL(blob);

                setScriptAudioUrl(audioUrl);
                setChangedGenerateAudio(true)
                dispatch(successAlert("Audio généré avec succès!", "success"));
            } else {
                dispatch(dangerAlert("Échec de la génération vocale via script."));
            }
        } catch (error) {
            dispatch(dangerAlert("Erreur lors de la génération audio: " + error.message));
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleSaveChanges = () => {
        if (!selectedNode || inputMin >= inputMax) return;

        setNodes((prevNodes) => {
            const existingInputNode = prevNodes.find(
                (node) => node.node_type === "input" && node.id !== selectedNode.id
            );

            if (nodeType === "input" && existingInputNode) {
                dispatch(
                    dangerAlert(
                        "Un nœud de type 'input' existe déjà. Veuillez en choisir un autre."
                    )
                );
                return prevNodes;
            }

            return prevNodes.map((node) =>
                node.id === selectedNode.id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label,
                            contentType,
                            audioFile: contentType === "audio" ? audioFile : null,
                            audioFileUrl: contentType === "audio" ? audioFileUrl : null,
                            script: contentType === "script" ? script : null,
                            scriptAudioUrl: contentType === "script" ? scriptAudioUrl : null,
                            generate: changedGenerateAudio ? null : {...node.data.generate},
                            timeoutNoInput,
                            timeoutInterDigit,
                            retryMax,
                            inputTerm,
                            inputMin,
                            inputMax,
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
            <button className="button-back" onClick={goBackToDefault}>
                <FaArrowLeft /> Retour
            </button>
            <h3   className="sidebar-tools">Wait DTMF Node</h3>

            <div className="label-input-section">
                <label>Label du nœud :</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Entrer le label"
                    className="label-input"
                />
            </div>


            <div className="content-type-section">
                <label>Type de contenu :</label>
                <div className="content-type-buttons">
                    <button
                        className={contentType === "audio" ? "content-type-button active-button" : "content-type-button"}
                        onClick={() => handleContentTypeChange("audio")}
                        type="button"
                    >
                        Audio
                    </button>
                    <button
                        className={contentType === "script" ? "content-type-button active-button" : "content-type-button"}
                        onClick={() => handleContentTypeChange("script")}
                        type="button"
                    >
                        Script
                    </button>
                </div>
            </div>

            {contentType === "audio" && (
                <div className="audio-section">
                    <label>Fichier audio :</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                        className="audio-input"
                    />
                    {audioFileUrl && (
                        <div className="audio-preview">
                            <div className="audio-container">
                                <audio
                                    ref={audioRef}
                                    src={audioFileUrl}
                                    controls
                                    className="audio-player"
                                />
                                <button
                                    onClick={() => {
                                        setAudioFile(null);
                                        setAudioFileUrl(null);
                                    }}
                                    className="delete-button"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {contentType === "script" && (
                <div className="script-section">
                    <label>Script :</label>
                    <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="Entrer le script"
                        className="script-textarea"
                    />
                    {scriptAudioUrl && (
                        <div className="script-audio-preview">
                            <div className="audio-container">
                                <audio
                                    ref={scriptAudioRef}
                                    src={scriptAudioUrl}
                                    controls
                                    className="audio-player"
                                />
                                <button
                                    onClick={() => setScriptAudioUrl(null)}
                                    className="delete-button"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="script-actions">
                        {script && !scriptAudioUrl && (
                            <button
                                onClick={generateAudioFromScript}
                                disabled={isGeneratingAudio}
                                className={`generate-audio-button ${isGeneratingAudio ? "disabled" : ""}`}
                            >
                                <Volume2 size={16} />
                                {isGeneratingAudio ? "Génération..." : "Générer Audio"}
                            </button>
                        )}

                    </div>
                </div>
            )}



            <div  className="form-group select-group">
                <label>No Input Timeout (secondes) :</label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={timeoutNoInput}
                    onChange={(e) => setTimeoutNoInput(Number(e.target.value))}
                    placeholder="Timeout No Input"
                    className="form-input"
                />
            </div>

            <div  className="form-group select-group">
                <label>Inter Digit Timeout (secondes) :</label>
                <input
                    type="number"
                    min="1"
                    max="60"
                    value={timeoutInterDigit}
                    onChange={(e) => setTimeoutInterDigit(Number(e.target.value))}
                    placeholder="Timeout Inter Digit"
                    className="form-input"
                />
            </div>

            <div className="form-group select-group">
                <label>Nombre de tentatives :</label>
                <input
                    type="number"
                    min="1"
                    value={retryMax}
                    onChange={(e) => setRetryMax(Number(e.target.value))}
                    placeholder="Nombre de tentatives"
                    className="form-input"
                />
            </div>

            <div  className="form-group select-group">
                <label>Terme :</label>
                <input
                    type="text"
                    value={inputTerm}
                    onChange={(e) => setInputTerm(e.target.value)}
                    placeholder="Entrer le terme"
                    className="form-input"
                />
            </div>

            <div  className="form-group select-group">
                <label>Min :</label>
                <input
                    type="number"
                    min="1"
                    value={inputMin}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value < inputMax) {
                            setInputMin(value);
                        } else {
                            dispatch(dangerAlert("La valeur min doit être inférieure à max."));
                        }
                    }}
                    className="form-input"
                />
            </div>

            <div  className="form-group select-group">
                <label>Max :</label>
                <input
                    type="number"
                    max="10"
                    value={inputMax}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > inputMin) {
                            setInputMax(value);
                        } else {
                            dispatch(dangerAlert("La valeur max doit être supérieure à min."));
                        }
                    }}
                    className="form-input"
                />
            </div>

            <div  className="form-group select-group">
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

export default WaitDTMFSidebar;