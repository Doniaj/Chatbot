const {baseModelbo} = require("./basebo");
const audioStream = require("../config/config.json")["audioStream"];
const moment = require("moment");
const axios = require("axios");
const {INTENT} = require("../helpers/consts");
const { Op } = require('sequelize');
const TextToSpeechService = require('./efilesbo');

class Pdrvbo extends baseModelbo {

    defaultNodes = {
        ANSWER: 'answer',
        USER_DETAILS: 'user-details',
        PROPOSITION_CHAT: 'proposition-chat',
        PROPOSITION_CLIENT: 'proposition-client',
        AVAILABLE_APPOINTMENT: 'available-appointment',
        UNAVAILABLE_APPOINTMENT: 'unavailable-appointment'
    };
    classifyIntent = async (text) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await axios.post("http://136.243.21.108:8000/classify",
                {text},
                {
                    signal: controller.signal,
                    timeout: 5000
                }
            );

            clearTimeout(timeoutId);
            console.log("Classification result:", response.data);
            return response.data;
        } catch (error) {
            console.error('Classification error:', error.message);
            return null;
        }
    }
    extractBestIntent = (classificationResult) => {
        if (!classificationResult || !classificationResult.success) {
            return null;
        }

        if (classificationResult.intent) {
            return classificationResult.intent;
        }

        if (classificationResult.probabilities) {
            let bestIntent = null;
            let bestScore = 0;

            Object.entries(classificationResult.probabilities).forEach(([intent, score]) => {
                if (score > bestScore) {
                    bestScore = score;
                    bestIntent = intent;
                }
            });
            return bestScore > 0.5 ? bestIntent : null;
        }

        return null;
    }
    extraireNumeroSIP(uri) {
        const regex = /sip:(\d+)@/;
        const match = uri.match(regex);
        return match ? match[1] : null;
    }
    handleRequest = (req, res) => {
        const {sipToURI} = req.body;

        if (!sipToURI) {
            return res.status(400).json({
                success: false,
                message: 'sipToURI is required'
            });
        }

        const phoneNumber = this.extraireNumeroSIP(sipToURI);

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Numéro de téléphone invalide',
            });
        }

        this.db.users.findOne({
            where: {phone_number: phoneNumber},
            include: [
                {
                    model: this.db["workflows"]
                },
            ],
        })
            .then(user => {
                if (!user) {
                    return this.hangup(res, "USER_NOT_FOUND", req.body.callID || "unknown");
                }
                if (!user.workflow) {
                    return this.hangup(res, "NO_WORKFLOW_FOUND", req.body.callID || "unknown");
                }

                const workflow = user.workflow;
                const flowData = {
                    callID: req.body.callID || "generated_" + Date.now(),
                    sipToURI: req.body.sipToURI,
                    customVars: {
                        workflow_id: workflow.id,
                        phone_number: phoneNumber,
                        ...req.body.customVars
                    },
                    sipFromURI: req.body.sipFromURI,
                    event: req.body.event || "incoming:incoming",
                    digits: req.body.digits,
                    asrText: req.body.asrText,
                    serverIP: req.body.serverIP,

                };
                console.log("Flow data: ", flowData);
                return this._getflow(res, flowData);
            })
            .catch(error => {
                console.error('Error handling request:', error);
                return this.hangup(res, "ERROR_CHECKING_WORKFLOW", req.body.callID || "unknown");
            });
    }
    checkCall = (res, data, isInbound) => {
        return new Promise((resolve, reject) => {
            let {
                callID, sipToURI, customVars, sipFromURI, event, digits, lastestNode, asrText,
                recordFileName, recordTerm, recordLength
            } = data;
            console.log("calling hereeeeeeeeeeeeeeeeeeeeee")
            console.log(data)
            if (Object.keys(lastestNode).length === 0) {
                const workflow_id = customVars?.workflow_id;

                if (!workflow_id) {
                    return resolve({action: "hangup", reason: "WORKFLOW_ID_NOT_FOUND"});
                }

                this.db['workflows'].findOne({
                    where: {
                        id: workflow_id,
                        status: "Y"
                    }
                }).then((workflow) => {
                    if (!workflow) return resolve({action: "hangup", reason: "WORKFLOW_NOT_FOUND"});

                    let flow = workflow["react_flow"] || {};
                    let nodes = flow.nodes || [];
                    let edges = flow.edges || [];

                    if (nodes.length === 0) return resolve({
                        action: "hangup",
                        reason: "NO_NODES"
                    });

                    if (nodes.length === 1 && nodes[0].type !== 'playMusic' && edges.length === 0) return resolve({
                        action: "hangup",
                        reason: "NO_EDGES"
                    });

                    let _data = {
                        call_id: callID,
                        nodes,
                        workflow_id,
                        lastestNode,
                        customVars,
                        edges,
                        digits,
                        asrText,
                        recordFileName,
                        recordTerm,
                        recordLength
                    };

                    return resolve({action: "answer", data: _data});
                }).catch((err) => {
                    console.error("Error finding workflow:", err);
                    return resolve({action: "hangup", reason: "ERROR_FINDING_WORKFLOW"});
                });
            } else if (lastestNode.action === 'hangup') {
                return resolve({action: "hangup", reason: "ALREADY_HANGUP"});
            } else {
                this.db['workflows'].findOne({
                    where: {
                        id: lastestNode.workflow_id,
                        status: "Y"
                    }
                }).then((workflow) => {
                    if (!workflow) return resolve({action: "hangup", reason: "WORKFLOW_NOT_FOUND"});

                    let flow = workflow["react_flow"] || {};
                    let nodes = flow.nodes || [];
                    let edges = flow.edges || [];

                    if (nodes.length === 0) return resolve({
                        action: "hangup",
                        reason: "NO_NODES"
                    });

                    if (nodes.length === 1 && nodes[0].type !== 'playMusic' && edges.length === 0) return resolve({
                        action: "hangup",
                        reason: "NO_EDGES"
                    });

                    let _data = {
                        call_id: callID,
                        nodes,
                        workflow_id: lastestNode.workflow_id,
                        lastestNode,
                        customVars,
                        edges,
                        digits,
                        asrText,
                        recordFileName,
                        recordTerm,
                        recordLength
                    };

                    return resolve({action: "next", data: _data});
                }).catch((err) => {
                    console.error("Error finding workflow:", err);
                    return resolve({action: "hangup", reason: "ERROR_FINDING_WORKFLOW"});
                });
            }
        });
    }
    hangup = (res, reason, call_id, data = {}, customVars = {}) => {
        console.log("=============> HANGUP : ", reason);

        if (reason === "ALREADY_HANGUP") {
            return res.send({
                action: "hangup",
                reason,
                customVars
            });
        } else {
            this.checkHangup(call_id).then((result_check) => {
                if (result_check.length === 0) {
                    let _data = {
                        workflow_id: data.workflow_id || customVars.workflow_id,
                        reason: "CALL_NOT_FOUND",
                        action: "hangup",
                        status: "Y",
                        flow: [{
                            action: "hangup",
                            reason: "CALL_NOT_FOUND",
                            customVars: {
                                call_id,
                                step: 1
                            }
                        }],
                        created_at: new Date(),
                        updated_at: new Date()
                    };

                    const pdrv_history = this.db['pdrv_history'].build(_data);
                    pdrv_history.save().then(() => {
                        return res.send({
                            action: "hangup",
                            reason: "CALL_NOT_FOUND"
                        });
                    }).catch((error) => {
                        console.error("Error saving hangup:", error);
                        return res.send({
                            action: "hangup",
                            reason: "ERROR_SAVING_HANGUP"
                        });
                    });
                } else if (parseInt(result_check[0].step) === 0) {
                    return res.send({
                        action: "hangup",
                        reason: "ALREADY_HANGUP",
                        customVars
                    });
                } else {
                    let telcoResponse = {
                        action: "hangup",
                        reason: reason,
                        customVars: {
                            step: parseInt(result_check[0].step || 0) + 1,
                            call_id: call_id
                        }
                    };

                    let callH = result_check[0].flow;
                    callH.push(telcoResponse);

                    this.db['pdrv_history'].update(
                        {
                            flow: callH,
                            updated_at: new Date()
                        },
                        {where: {history_id: result_check[0].history_id}}
                    ).then(() => {
                        return res.send(telcoResponse);
                    }).catch((error) => {
                        console.error("Error updating call history:", error);
                        return res.send({
                            action: "hangup",
                            reason: "ERROR_UPDATING_HISTORY"
                        });
                    });
                }
            }).catch(error => {
                console.error("Error checking hangup:", error);
                return res.send({
                    action: "hangup",
                    reason: "ERROR_CHECKING_HANGUP"
                });
            });
        }
    }
    answerAction = (res, _data) => {
        let {call_id, nodes, workflow_id, customVars} = _data;
        let node_id;
        const answerNode = nodes.find(n => n.type === this.defaultNodes.ANSWER || n.node_type === this.defaultNodes.ANSWER);

        if (answerNode) {
            node_id = answerNode.id;
        } else if (nodes.length === 1) {
            node_id = nodes[0].id;
        } else {
            const inputNode = nodes.find(n => n.type === "input" || n.node_type === "input");
            node_id = inputNode ? inputNode.id : nodes[0].id;
        }

        let data = {
            workflow_id,
            reason: "CALL_STARTED",
            action: "answer",
            status: "Y",
            flow: [{
                action: "answer",
                customVars: {
                    parent_node: this.defaultNodes.ANSWER,
                    call_id,
                    step: 1,
                    node_id,
                    node_type: this.defaultNodes.ANSWER,
                    ...customVars
                }
            }],
            created_at: new Date(),
            updated_at: new Date()
        };

        const pdrv_history = this.db['pdrv_history'].build(data);
        pdrv_history.save().then(() => {
            return res.send({
                action: "answer",
                customVars: {
                    call_id,
                    step: 1,
                    node_id,
                    node_type: this.defaultNodes.ANSWER,
                    ...customVars,
                    parent_node: this.defaultNodes.ANSWER
                }
            });
        }).catch((error) => {
            console.error("Error answering call:", error);
            this.hangup(res, "ERROR_ANSWERING", call_id);
        });
    }
    _getflow = (res, data) => {
        let {callID, sipToURI, customVars, sipFromURI, event, digits, asrText, serverIP} = data;
        console.log("==========================");
        console.log(data);
        console.log("==========================");

        let serverIpFromUri = sipFromURI ? sipFromURI.split("@")[1] : "";
        console.log(`---------------- ${serverIpFromUri !== serverIP ? 'INBOUND' : 'OUTBOUND'} Call ---------------------------`);

        this.getLatestNode(callID).then(lastestNode => {
            this.checkCall(res, {...data, lastestNode}, serverIpFromUri !== serverIP).then(result_check => {
                const _event = event ? event.split(':') : ["", "unknown"];

                switch (result_check.action) {
                    case 'hangup':
                        return this.hangup(res, result_check.reason, callID, customVars);
                    case 'answer':
                        if (_event[1] === "incoming") {
                            return this.answerAction(res, {...result_check.data, lastestNode});
                        } else {
                            return this.hangup(res, "ANSWER_WITHOUT_INCOMING_EVENT", callID, result_check.data, customVars);
                        }

                    case 'next':
                        return this.nodeActions(res, _event, {...result_check.data, lastestNode});
                    default:
                        return this.hangup(res, "UNKNOWN_ACTION", callID, customVars);
                }
            }).catch(error => {
                console.error("Error checking call:", error);
                return this.hangup(res, "ERROR_CHECKING_CALL", callID, customVars);
            });
        }).catch(error => {
            console.error("Error getting latest node:", error);
            return this.hangup(res, "ERROR_GETTING_LAST_NODE", callID, customVars);
        });
    }
    findCurrentNode = (nodes, nodeId) => {
        return nodes.find(n => n.id === nodeId);
    }
    callHistoryData(action, telcoResponse, data, callHistory) {
        return new Promise((resolve) => {
            if (!callHistory) {
                callHistory = [];
            }
            callHistory.push(telcoResponse);
            resolve({callHistory});
        });
    }
    saveCallHistoryAction = (res, telcoResponse, action = 'SAVE', data = {}) => {
        let querySelect = `
            SELECT history_id, flow
            FROM pdrv_history
            WHERE EXISTS (SELECT 1
                          FROM jsonb_array_elements(flow) AS step
                          WHERE step->'customVars'->>'call_id' = :callId 
            AND status = :active) LIMIT 1;
        `;

        this.db.sequelize["crm-app"].query(querySelect, {
            type: this.db.sequelize["crm-app"].QueryTypes.SELECT,
            replacements: {callId: telcoResponse.customVars.call_id, active: 'Y'},
        }).then(resultSelect => {
            if (resultSelect && resultSelect.length > 0) {
                const pdrv_history = resultSelect[0];
                this.callHistoryData(action, telcoResponse, data, pdrv_history.flow).then((currentCallHistory) => {
                    this.db['pdrv_history'].update({
                            flow: currentCallHistory.callHistory,
                            updated_at: moment(new Date())
                        },
                        {where: {history_id: pdrv_history.history_id, status: 'Y'}}).then(() => {
                        return res.send(telcoResponse);
                    }).catch(error => {
                        console.error("Error updating call history:", error);
                        return this.hangup(res, "ERROR_UPDATING_HISTORY", telcoResponse.customVars.call_id);
                    });
                });
            } else {
                console.error("No call history found for ID:", telcoResponse.customVars.call_id);
                return this.hangup(res, "CALL_HISTORY_NOT_FOUND", telcoResponse.customVars.call_id);
            }
        }).catch(error => {
            console.error("Error querying call history:", error);
            return this.hangup(res, "ERROR_QUERYING_HISTORY", telcoResponse.customVars.call_id);
        });
    }
    checkHangup = (call_id) => {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT pdrv_history.history_id,
                       pdrv_history.flow,
                       CASE
                           WHEN EXISTS (SELECT 1
                                        FROM jsonb_array_elements(pdrv_history.flow) AS step
                                        WHERE step->'customVars'->>'call_id' = :call_id 
                                      AND step->>'action' = 'hangup' 
                                      AND pdrv_history.status = :active)
                               THEN '0'
                           ELSE (SELECT step->'customVars'->>'step'
                FROM jsonb_array_elements(pdrv_history.flow) AS step
                WHERE step->'customVars'->>'call_id' = :call_id
                  AND pdrv_history.status = :active
                ORDER BY step->'customVars'->>'step' DESC
                    LIMIT 1
                    )
                END AS step
            FROM pdrv_history pdrv_history
            WHERE EXISTS (
                SELECT 1
                FROM jsonb_array_elements(pdrv_history.flow) AS step
                WHERE step->'customVars'->>'call_id' = :call_id 
                  AND pdrv_history.status = :active
            )
            LIMIT 1;
            `;

            this.db.sequelize["crm-app"]
                .query(query, {
                    type: this.db.sequelize["crm-app"].QueryTypes.SELECT,
                    replacements: {
                        call_id: call_id,
                        active: 'Y'
                    }
                })
                .then((result) => {
                    resolve(result);
                })
                .catch(error => {
                    console.error('Error in checkHangup:', error);
                    reject(error);
                });
        });
    }
    getNodeConnections = (nodeId, edges, nodes) => {
        return new Promise((resolve) => {
            console.log("Node ID:", nodeId, "Edges:", edges, "Nodes:", nodes);

            const previousNodeId = edges.reduce((acc, edge) => {
                return edge.target === nodeId ? edge.source : acc;
            }, null);

            const previousNode = previousNodeId ? nodes.filter(n => n.id === previousNodeId)[0] : undefined;

            const nextNodeIds = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
            console.log("Next node IDs found:", nextNodeIds);

            const nextNodes = nodes.filter(n => nextNodeIds.includes(n.id));
            console.log("Next nodes found:", nextNodes, "Length:", nextNodes.length);

            const currentNode = nodes.filter(nc => nc.id === nodeId);

            return resolve({
                previousNode,
                nextNodes,
                currentNode: currentNode[0]
            });
        });
    }
    updateDTMF = async (res, lastestNode, digits, nodes, edges, nextNodes, currentNodeData) => {
        console.log("Processing DTMF input:", digits);

        const call_id = lastestNode.customVars?.call_id || "unknown";

        if (!digits || digits.trim() === '') {
            console.log("No digits provided, using default flow");
            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    nodes,
                    edges
                });
            }
            return this.hangup(res, "NO_DIGITS_PROVIDED", call_id);
        }

        try {
            if (currentNodeData && currentNodeData.options && Array.isArray(currentNodeData.options)) {
                console.log("Checking configured options for digits:", digits);

                const option = currentNodeData.options.find(opt =>
                    opt.value === digits || opt.key === digits
                );

                if (option && option.nextNodeId) {
                    const targetNode = nodes.find(n => n.id === option.nextNodeId);
                    if (targetNode) {
                        console.log("Found target node from configured options:", targetNode.id);
                        return this.saveAction(res, {
                            node: targetNode,
                            lastestNode,
                            call_id,
                            digits,
                            nodes,
                            edges
                        });
                    }
                }
            }

            const digitValue = parseInt(digits);
            if (!isNaN(digitValue) && digitValue > 0 && digitValue <= nextNodes.length) {
                console.log(`Using numeric index ${digitValue} to select node`);
                const selectedNode = nextNodes[digitValue - 1];
                return this.saveAction(res, {
                    node: selectedNode,
                    lastestNode,
                    call_id,
                    digits,
                    nodes,
                    edges
                });
            }

            if (digits.length > 1 || isNaN(digitValue)) {
                console.log("Processing complex DTMF input with intent classification");

                const targetNode = await this.processMessageIntent(
                    digits,
                    nodes,
                    edges,
                    lastestNode.customVars.node_id,
                    lastestNode.customVars.parent_node || lastestNode.customVars.node_type
                );

                if (targetNode === 'HANGUP') {
                    return this.hangup(res, "USER_CANCELLED_VIA_DTMF", call_id);
                }

                if (targetNode) {
                    console.log("Using target node from DTMF intent:", targetNode.id);
                    return this.saveAction(res, {
                        node: targetNode,
                        lastestNode,
                        call_id,
                        digits,
                        nodes,
                        edges
                    });
                }
            }

            if (nextNodes.length > 0) {
                console.log("Using fallback - first available next node");
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    digits,
                    nodes,
                    edges
                });
            }
            console.log("No valid DTMF option found and no next nodes available");
            return this.hangup(res, "NO_VALID_DTMF_OPTION", call_id);

        } catch (error) {
            console.error("Error processing DTMF input:", error);

            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    digits,
                    nodes,
                    edges
                });
            }

            return this.hangup(res, "ERROR_PROCESSING_DTMF", call_id);
        }
    }
    saveAction = (res, data) => {
        const {node, lastestNode, call_id, asrText, record, nodes, edges} = data;

        if (!node || !node.type) {
            return this.hangup(res, "INVALID_NODE", call_id);
        }

        const enhancedData = {
            ...data,
            asrText,
            nodes: nodes || [],
            edges: edges || []
        };

        console.log("----------------------------------------", lastestNode);
        console.log(`Processing node type: ${node.type}, node ID: ${node.id}`);

        switch (node.type) {
            case 'waitDTMF':
            case 'dtmf':
                return this.dtmfAction(res, enhancedData);
            case 'waitSTREAM':
                return this.streamAction(res, enhancedData);
            case 'defaultNode':
                return this.defaultNodeAction(res, enhancedData);
            case 'playMusic':
                return this.playMusicAction(res, enhancedData);
            default:
                console.log(`Unsupported node type: ${node.type}, treating as generic node`);
                return this.genericNodeAction(res, enhancedData);
        }
    }
    defaultNodeAction = (res, data) => {
        let {node, lastestNode, call_id,asrText, nodes, edges} = data;

        console.log("Processing defaultNode:", node.id, "Label:", node.data?.label);
        console.log("gggggggggggggggggggggggg", nodes.length, edges.length);
        if (!edges) {
            console.error("Edges is undefined in defaultNodeAction");
            return this.hangup(res, "MISSING_EDGES_DATA", call_id);
        }

        if (!nodes) {
            console.error("Nodes is undefined in defaultNodeAction");
            return this.hangup(res, "MISSING_NODES_DATA", call_id);
        }
        const nodeLabel = node.data?.label;

        if (!nodeLabel) {
            console.log("No label found for defaultNode, using generic flow");
            return this.genericDefaultNodeFlow(res, data);
        }

        console.log("DefaultNode label:", nodeLabel);
        const newData = {
            ...data,
            lastestNode: {
                ...lastestNode,
                customVars: {
                    ...lastestNode.customVars,
                    parent_node: nodeLabel,
                    node_type: nodeLabel,
                    current_label: nodeLabel,
                    asrText
                }
            }
        };

        console.log("is here 1")
        this.getNodeConnections(node.id, edges, nodes).then((resultConnections) => {
            let {nextNodes} = resultConnections;

            if (nextNodes.length === 0) {
                console.log("No next nodes found for defaultNode");
                return this.hangup(res, "NO_NEXT_NODE_FOR_DEFAULT", call_id);
            }

            const nextNode = nextNodes[0];
            console.log("Mapping defaultNode to next node:", nextNode.id, "Type:", nextNode.type);

            return this.saveAction(res, {
                ...newData,
                node: nextNode
            });

        }).catch(error => {
            console.error("Error getting node connections for defaultNode:", error);
            return this.hangup(res, "ERROR_GETTING_CONNECTIONS", call_id);
        });
    }
    genericDefaultNodeFlow = (res, data) => {
        let {node, lastestNode, call_id, nodes, edges} = data;

        console.log("is here 2")
        this.getNodeConnections(node.id, edges, nodes).then((resultConnections) => {
            let {nextNodes} = resultConnections;

            if (nextNodes.length === 0) {
                return this.hangup(res, "NO_NEXT_NODE_FOR_DEFAULT", call_id);
            }

            const nextNode = nextNodes[0];
            return this.saveAction(res, {
                ...data,
                node: nextNode
            });

        }).catch(error => {
            console.error("Error getting node connections:", error);
            return this.hangup(res, "ERROR_GETTING_CONNECTIONS", call_id);
        });
    }
    nodeActions = (res, _event, data) => {
        let {nodes, lastestNode, customVars, edges, digits, asrText, recordFileName, recordTerm, recordLength} = data;
        let {node_id} = lastestNode;
        let event = _event[1] + ':' + _event[2];
        const currentNodeType = lastestNode.value?.customVars?.type || lastestNode.value?.customVars?.node_type;

        console.log("=== DEBUG nodeActions ===");
        console.log("Event:", event);
        console.log("Current node_id:", node_id);
        console.log("ASR Text:", asrText);
        console.log("Latest node:", lastestNode);
        console.log("========================");

        if (_event[2] === 'completed') {
            console.log("is here 3")
            this.getNodeConnections(node_id, edges, nodes).then(async (resultConnections) => {
                let {nextNodes, currentNode} = resultConnections;
                let currentNodeData = currentNode.data;

                console.log("Next nodes found:", nextNodes, nextNodes.length);
                console.log("Current node type:", currentNode.type);
                console.log("Current node data:", currentNodeData);

                if (_event[1] === 'getDTMF') {
                    // Special handling for waitSTREAM nodes that receive getDTMF events
                    if (currentNode.type === 'waitSTREAM') {
                        console.log("waitSTREAM node receiving getDTMF event, treating as stream");
                        let record = {
                            recordFileName, recordTerm, recordLength
                        };
                        return this.updateSTREAM(res, lastestNode.value, asrText, nodes, edges, nextNodes, record, currentNode);
                    } else {
                        return this.updateDTMF(res, lastestNode.value, digits, nodes, edges, nextNodes, currentNodeData);
                    }
                }

                if (_event[1] === 'stream') {
                    let record = {
                        recordFileName, recordTerm, recordLength
                    };

                    if (currentNode.type === 'playMusic') {
                        console.log("============== record:completed -----> asrText : ", asrText, lastestNode);
                        return this.updateplayMusic(res, lastestNode.value, asrText, nodes, edges, nextNodes, record, currentNodeData, currentNodeType);
                    } else {
                        return this.updateSTREAM(res, lastestNode.value, asrText, nodes, edges, nextNodes, record, currentNode);
                    }
                }

                if (_event[1] === 'play') {
                    console.log("Processing play:completed event");
                    console.log("Current node type:", currentNode.type);
                    console.log("Next nodes available:", nextNodes.length);

                    if (currentNode.type === 'playMusic') {
                        return this.updateplayMusic(res, lastestNode.value, asrText, nodes, edges, nextNodes, {}, currentNodeData, currentNodeType);
                    } else if (currentNode.type === 'stream') {
                        return this.updateSTREAM(res, lastestNode.value, asrText, nodes, edges, nextNodes, {}, currentNodeData, currentNodeType);
                    } else {
                        if (nextNodes.length === 1) {
                            console.log("Auto-continuing to next node after play");
                            return this.saveAction(res, {
                                node: nextNodes[0],
                                lastestNode: lastestNode.value,
                                call_id: data.call_id,
                                nodes,
                                edges
                            });
                        } else if (nextNodes.length === 0) {
                            console.log("No next nodes, ending call normally");
                            return this.hangup(res, "NORMAL_CLEARING", data.call_id, customVars);
                        } else {
                            console.log("Multiple next nodes, taking first one");
                            return this.saveAction(res, {
                                node: nextNodes[0],
                                lastestNode: lastestNode.value,
                                call_id: data.call_id,
                                nodes,
                                edges
                            });
                        }
                    }
                }

                if (asrText && asrText.trim() !== '') {
                    console.log("Processing ASR text:", asrText);
                    const targetNode = await this.processMessageIntent(asrText, nodes, edges, node_id, currentNodeType);

                    if (targetNode) {
                        console.log("Found target node from intent:", targetNode.id, nodes.length, edges.length);
                        return this.saveAction(res, {
                            node: targetNode,
                            lastestNode: lastestNode.value,
                            call_id: data.call_id,
                            asrText,
                            nodes,
                            edges
                        });
                    }
                }

                if (nextNodes.length === 0 && currentNode.type === 'playMusic') {
                    console.log("PlayMusic with no next nodes, continuing same node");
                    return this.saveAction(res, {
                        node: currentNode,
                        lastestNode: lastestNode.value,
                        call_id: data.call_id,
                        nodes,
                        edges
                    });
                }

                if (nextNodes.length === 1) {
                    console.log("Single next node, continuing");
                    return this.saveAction(res, {
                        node: nextNodes[0],
                        lastestNode: lastestNode.value,
                        call_id: data.call_id,
                        nodes,
                        edges
                    });
                } else if (nextNodes.length > 1) {
                    console.log("Multiple next nodes, taking first one");
                    return this.saveAction(res, {
                        node: nextNodes[0],
                        lastestNode: lastestNode.value,
                        call_id: data.call_id,
                        nodes,
                        edges
                    });
                } else {
                    console.log("No next nodes available");
                    return this.hangup(res, "NORMAL_CLEARING", data.call_id, customVars);
                }
            }).catch(error => {
                console.error("Error in node connections:", error);
                return this.hangup(res, "ERROR_GETTING_NODE_CONNECTIONS", data.call_id, customVars);
            });
        } else {
            console.log("Wrong event, expected 'completed' but got:", _event[2]);
            return this.hangup(res, "WRONG_EVENT", data.call_id, customVars);
        }
    }
    genericNodeAction = (res, data) => {
        let {node, lastestNode, call_id} = data;

        let telcoResponse = {
            action: "play",
            audio: node.data?.file ? [`efile-${node.data.file}.mp3`] : [],
            customVars: {
                label: node.data?.label || "Generic Node",
                step: parseInt(lastestNode.customVars?.step || 0) + 1,
                call_id: lastestNode.customVars?.call_id || call_id,
                node_id: node.id,
                type: node.type,
                phone_number: lastestNode.customVars?.phone_number,
                status: 'completed'
            }
        };

        return this.saveCallHistoryAction(res, telcoResponse);
    }
    dtmfAction = async (res, data) => {
        let {node, lastestNode, call_id} = data;

        if (lastestNode.customVars?.parent_node === 'user-details') {
            try {
                const appointmentDate = lastestNode.customVars.extracted_date;
                const appointmentTime = lastestNode.customVars.extracted_time;

                const phone_number = lastestNode.customVars?.phone_number;
                const call_id = lastestNode.customVars?.call_id;

                if (!phone_number) {
                    throw new Error('Numéro de téléphone manquant');
                }

                // Extraire le numéro de téléphone du client depuis le callID
                const clientPhoneNumber = this.extractClientPhoneFromCallID(call_id);
                
                if (!clientPhoneNumber) {
                    throw new Error('Impossible d\'extraire le numéro de téléphone du client');
                }
                
                // Récupérer l'utilisateur (professionnel) pour obtenir l'admin_id
                const user = await this.db.users.findOne({
                    where: { phone_number: phone_number }
                });
                
                if (!user) {
                    throw new Error('Professionnel non trouvé');
                }

                // Extraire le prénom et nom depuis le texte ASR (provenant des digits/DTMF)
                let clientFirstName = null;
                let clientLastName = null;
                let clientFullName = null;
                
                // Le texte ASR peut venir des digits (quand l'utilisateur parle son nom)
                const asrNameText = lastestNode.customVars?.asrText || data.asrText;
                
                if (asrNameText && asrNameText.trim()) {
                    const nameParts = asrNameText.trim().split(/\s+/);
                    
                    if (nameParts.length >= 1) {
                        clientFirstName = nameParts[0];
                        clientFullName = clientFirstName;
                    }
                    if (nameParts.length >= 2) {
                        clientLastName = nameParts.slice(1).join(' '); // Rejoindre le reste comme nom de famille
                        clientFullName = `${clientFirstName} ${clientLastName}`;
                    }
                    
                    console.log('Nom extrait du texte ASR:', {
                        originalText: asrNameText,
                        firstName: clientFirstName,
                        lastName: clientLastName,
                        fullName: clientFullName
                    });
                }

                const mockReq = {
                    body: {
                        phone_number: clientPhoneNumber, // Numéro du CLIENT
                        first_name: clientFirstName,
                        last_name: clientLastName,
                        name: clientFullName,
                        created_via: 'phone_call',
                        call_id: call_id,
                        admin_id: user.user_id // ID du professionnel comme admin_id
                    }
                };

                const clientResponse = await this.checkOrCreateClient(mockReq);

                if (!clientResponse.success) {
                    throw new Error(clientResponse.message || 'Erreur lors de la gestion du client');
                }

                const clientDataResult = clientResponse.client;
                
                // Calculer l'heure de fin à partir de la durée du rendez-vous
                const appointmentDuration = user.appointment_duration ;
                const startTime = moment(appointmentTime, 'HH:mm');
                const endTime = startTime.clone().add(appointmentDuration, 'minutes').format('HH:mm');

                const availabilityData = {
                    user_id: user.user_id, // ID du professionnel
                    type: 'appointment',
                    client_id: clientDataResult.id,
                    start_date: appointmentDate,
                    end_date: appointmentDate,
                    start_time: appointmentTime,
                    end_time: endTime, // Heure de fin calculée
                    appointment_date: appointmentDate,
                    notes: `Rendez-vous programmé via appel téléphonique - Call ID: ${call_id}`,
                    phone_number: clientPhoneNumber, // Numéro du CLIENT
                    created_via: 'phone_call',
                    call_id: call_id,
                    active: 'Y',
                    status: 'Y'
                };

                if (!availabilityData.client_id) {
                    throw new Error('Impossible de créer ou récupérer le client');
                }

                if (!availabilityData.appointment_date || !availabilityData.start_time) {
                    throw new Error('Date et heure du rendez-vous sont requises');
                }


                const newAvailability = await this.db.availability.create(availabilityData);

                console.log('Rendez-vous créé avec succès dans availability:', newAvailability.id);

                lastestNode.customVars.availability_id = newAvailability.id;
                lastestNode.customVars.client_id = clientDataResult.id;
                lastestNode.customVars.booking_status = 'success';

            } catch (error) {
                console.error('Erreur lors de la création du rendez-vous:', error);

                let errorResponse = {
                    action: "getDTMF",
                    timeout: node.data?.timeout || 10,
                    term: node.data?.term || "#",
                    audio: ["error_booking.mp3"],
                    customVars: {
                        ...lastestNode.customVars,
                        error: error.message,
                        status: 'error',
                        booking_status: 'failed'
                    }
                };

                return this.saveCallHistoryAction(res, errorResponse);
            }
        }

        let telcoResponse = {
            action: "getDTMF",
            timeout: node.data?.timeout || 10,
            term: node.data?.term || "#",
            audio: node.data?.file ? [`efile-${node.data.file}.mp3`] : [],
            customVars: {
                label: node.data?.label || "DTMF Input",
                step: parseInt(lastestNode.customVars?.step || 0) + 1,
                call_id: lastestNode.customVars?.call_id || call_id,
                node_id: node.id,
                type: node.type,
                phone_number: lastestNode.customVars?.phone_number,
                status: 'waiting_input',
                parent_node: lastestNode.customVars?.parent_node,
                ...lastestNode.customVars
            }
        };

        return this.saveCallHistoryAction(res, telcoResponse);
    }
    streamAction = async (res, data) => {
        let { node, lastestNode, call_id, asrText } = data;

        console.log("lastestNode =====================> : ", lastestNode);

        let telcoResponse = {
            action: "stream",
            timeout: node.data?.timeout || 10,
            format: "mp3",
            audio: node.data.audioFile ? [`efile-${node.data.audioFile}.mp3`] : [],
            customVars: {
                label: node.data?.label || "Stream",
                step: parseInt(lastestNode.customVars?.step || 0) + 1,
                call_id: lastestNode.customVars?.call_id || call_id,
                node_id: node.id,
                type: node.type,
                phone_number: lastestNode.customVars?.phone_number,
                status: 'streaming',
                parent_node: lastestNode.customVars?.parent_node,
                asrText,
                // Carry forward the extracted date and time from previous steps
                extracted_date: lastestNode.customVars?.extracted_date,
                extracted_time: lastestNode.customVars?.extracted_time,
            }
        };

        return this.saveCallHistoryAction(res, telcoResponse);
    };
    getDefaultNextNode = (edges, nodes, currentNodeId) => {
        const nextNodeIds = edges.filter(edge => edge.source === currentNodeId).map(edge => edge.target);
        const nextNodes = nodes.filter(n => nextNodeIds.includes(n.id));
        return nextNodes.length > 0 ? nextNodes[0] : null;
    }
    handleAnswerNodeIntent = (intent, nodes, edges, currentNodeId, nextNodes, classificationResult) => {
        switch (intent) {
            case INTENT.CONFIRMER:
                return this.findNodeByLabel(nodes, 'prop-chat') ||
                    this.findNodeByLabel(nodes, 'proposition-chat') ||
                    this.findNodeByType(nextNodes, 'proposition-chat');

            case INTENT.RESERVER:
                return this.findNodeByLabel(nodes, 'prop-client') ||
                    this.findNodeByLabel(nodes, 'proposition-client') ||
                    this.findNodeByType(nextNodes, 'proposition-client');

            case INTENT.ANNULER:
                return 'HANGUP';

            default:
                return nextNodes.length > 0 ? nextNodes[0] : null;
        }
    }
    handlePropChatIntent = (intent, nodes, edges, currentNodeId, nextNodes, classificationResult) => {

        switch (intent) {
            case INTENT.CONFIRMER:
                console.log("Proposition-chat + CONFIRMER -> searching for available-appointment");

                // Essayer plusieurs stratégies de recherche
                let targetNode = this.findNodeByLabel(nodes, 'available-appointment');
                if (!targetNode) {
                    targetNode = this.findNodeByLabel(nodes, 'available-appo');
                }
                if (!targetNode) {
                    targetNode = nodes.find(n =>
                        n.data?.label?.toLowerCase().includes('available') &&
                        n.data?.label?.toLowerCase().includes('appointment')
                    );
                }
                if (!targetNode) {
                    targetNode = this.findNodeByType(nextNodes, 'available-appointment');
                }

                console.log(`Target node found:`, targetNode ? {
                    id: targetNode.id,
                    label: targetNode.data?.label
                } : 'NULL');
                return targetNode;

            case INTENT.RESERVER:
                console.log("Proposition-chat + RESERVER -> searching for proposition-client");
                return this.findNodeByLabel(nodes, 'prop-client') ||
                    this.findNodeByLabel(nodes, 'proposition-client') ||
                    this.findNodeByType(nextNodes, 'proposition-client');

            case INTENT.ANNULER:
                console.log("Proposition-chat + ANNULER -> stay in proposition-chat");
                return this.findCurrentNode(nodes, currentNodeId);

            default:
                console.log("Proposition-chat + DEFAULT -> first next node");
                return nextNodes.length > 0 ? nextNodes[0] : null;
        }
    }
    handlePropClientIntent = async (intent, nodes, edges, currentNodeId, nextNodes, classificationResult) => {
        console.log(`Handling proposition-client intent: ${intent}`);

        switch (intent) {
            case INTENT.CONFIRMER:
                const availableNode = this.findNodeByLabel(nodes, 'available-appointment');
                console.log("Prop-client + confirm -> available-appointment");
                return availableNode;

            case INTENT.RESERVER:
                const currentNode = this.findCurrentNode(nodes, currentNodeId);
                console.log("Prop-client + reserve -> loop in proposition-client");
                return currentNode;

            case INTENT.ANNULER:
                const unavailableNode = this.findNodeByLabel(nodes, 'unavailable-appointment');
                console.log("Prop-client + annuler -> unavailable-appointment");
                return unavailableNode;

            default:
                console.log("Prop-client + default -> first next node");
                return nextNodes.length > 0 ? nextNodes[0] : null;
        }
    }
    handleAvailableAppointmentIntent = async (intent, nodes, edges, currentNodeId, nextNodes, classificationResult) => {
        console.log(`Handling available-appointment intent: ${intent}`);

        switch (intent) {
            case INTENT.CONFIRMER:
            case INTENT.RESERVER:
                const userDetailsNode = this.findNodeByLabel(nodes, 'user-details');
                console.log("Available-appointment + confirm/reserve -> user-details");
                return userDetailsNode;

            case INTENT.ANNULER:
                const propChatNode = this.findNodeByLabel(nodes, 'proposition-chat');
                console.log("Available-appointment + annuler -> proposition-chat");
                return propChatNode;

            default:
                console.log("Available-appointment + default -> first next node");
                return nextNodes.length > 0 ? nextNodes[0] : null;
        }
    }
    handleUnavailableAppointmentIntent = async (intent, nodes, edges, currentNodeId, nextNodes, classificationResult) => {
        console.log(`Handling unavailable-appointment intent: ${intent}`);

        const propChatNode = this.findNodeByLabel(nodes, 'proposition-chat');
        console.log("Unavailable-appointment -> proposition-chat");
        return propChatNode || (nextNodes.length > 0 ? nextNodes[0] : null);
    }
    extractClientPhoneFromCallID = (callID) => {
        if (!callID) return null;
        
        // Supprimer la partie "-@SVIGateway" ou similaire du callID
        const phoneNumber = callID.split('-@')[0];
        console.log(`📞 Phone extracted from callID "${callID}" -> "${phoneNumber}"`);
        return phoneNumber;
    }
    
    handleUserDetailsIntent = async (intent, nodes, edges, currentNodeId, nextNodes, classificationResult, asrText, currentNode) => {
        console.log(`Handling user-details intent: ${intent}`);
        console.log("ASR Text for user details:", asrText);
        console.log("Current node:", currentNode);
        
        try {
            if (asrText && asrText.trim() !== '') {
                // Récupérer call_id de différentes sources possibles
                let call_id = currentNode?.customVars?.call_id;
                
                if (!call_id) {
                    console.error("❌ No call_id found in current node");
                    return nextNodes.length > 0 ? nextNodes[0] : null;
                }
                
                console.log(`🔍 Using call_id: ${call_id}`);
                
                // Extraire le numéro de téléphone du client depuis le callID
                const clientPhoneNumber = this.extractClientPhoneFromCallID(call_id);
                
                if (!clientPhoneNumber) {
                    console.error("❌ Impossible d'extraire le numéro de téléphone du callID:", call_id);
                    return nextNodes.length > 0 ? nextNodes[0] : null;
                }
                
                // Récupérer les dernières informations de l'appel depuis l'historique
                const latestCallData = await this.getLatestNode(call_id);
                console.log("📋 Latest call data:", latestCallData);
                
                // Extraire les données de l'appel
                const callCustomVars = latestCallData.value?.customVars || {};
                const extractedDate = callCustomVars.extracted_date;
                const extractedTime = callCustomVars.extracted_time;
                const workflowId = callCustomVars.workflow_id;
                
                // Récupérer le numéro de téléphone du professionnel (user) depuis l'historique
                const professionalPhoneNumber = callCustomVars.phone_number;
                
                console.log("📊 Données extraites:", {
                    call_id,
                    clientPhoneNumber, // Numéro du client (extrait du callID)
                    professionalPhoneNumber, // Numéro du professionnel
                    extractedDate,
                    extractedTime,
                    workflowId,
                    clientName: asrText.trim()
                });
                
                if (!professionalPhoneNumber) {
                    console.error("❌ Numéro de téléphone du professionnel non trouvé dans l'historique");
                    return nextNodes.length > 0 ? nextNodes[0] : null;
                }
                
                // Récupérer l'utilisateur (professionnel) pour obtenir l'admin_id
                const professional = await this.db.users.findOne({
                    where: { phone_number: professionalPhoneNumber }
                });
                
                if (!professional) {
                    console.error("❌ Aucun professionnel trouvé pour obtenir admin_id:", professionalPhoneNumber);
                    return nextNodes.length > 0 ? nextNodes[0] : null;
                }
                
                // Créer ou vérifier le client avec le numéro extrait du callID
                const mockReq = {
                    body: {
                        phone_number: clientPhoneNumber, // LE NUMÉRO DU CLIENT
                        name: asrText.trim(), // Nom fourni par le client
                        created_via: 'phone_call',
                        call_id: call_id, // Ajouter l'ID de l'appel
                        admin_id: professional.user_id // ID du professionnel comme admin_id
                    }
                };
                
                console.log("👤 Création/vérification client avec:", mockReq.body);
                const clientResponse = await this.checkOrCreateClient(mockReq);
                console.log("✅ Réponse client:", clientResponse);
                
                // Créer le rendez-vous si nous avons toutes les informations nécessaires
                if (clientResponse.success && extractedDate && extractedTime) {
                    
                    // Récupérer l'utilisateur (professionnel) pour avoir le user_id correct
                    const user = await this.db.users.findOne({
                        where: { phone_number: professionalPhoneNumber }
                    });
                    
                    if (!user) {
                        console.error("❌ Aucun professionnel trouvé pour le numéro:", professionalPhoneNumber);
                        return nextNodes.length > 0 ? nextNodes[0] : null;
                    }
                    
                    // Calculer l'heure de fin (durée par défaut 60 minutes)
                    const appointmentDuration = user.appointment_duration || 60;
                    const startTime = moment(extractedTime, 'HH:mm');
                    const endTime = startTime.clone().add(appointmentDuration, 'minutes').format('HH:mm');
                    
                    const availabilityData = {
                        user_id: user.user_id, // ID du professionnel
                        type: 'appointment',
                        client_id: clientResponse.client.id, // ID du client
                        start_date: extractedDate,
                        end_date: extractedDate,
                        start_time: extractedTime,
                        end_time: endTime,
                        appointment_date: extractedDate,
                        notes: `RDV via appel - Client: ${asrText.trim()} (${clientPhoneNumber}) - Call: ${call_id}`,
                        phone_number: clientPhoneNumber, // NUMÉRO DU CLIENT
                        created_via: 'phone_call',
                        call_id: call_id,
                        active: 'Y',
                        status: 'Y',
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                    
                    console.log("🗓️ Création du rendez-vous avec:", availabilityData);
                    
                    const newAvailability = await this.db.availability.create(availabilityData);
                    console.log('✅ RENDEZ-VOUS CRÉÉ AVEC SUCCÈS:', {
                        appointment_id: newAvailability.id,
                        date: extractedDate,
                        time: `${extractedTime} - ${endTime}`,
                        client_name: clientResponse.client.name || asrText.trim(),
                        client_phone: clientPhoneNumber,
                        client_id: clientResponse.client.id,
                        professional_phone: professionalPhoneNumber,
                        professional_id: user.user_id,
                        call_id: call_id
                    });
                    
                } else {
                    console.warn('⚠️ Impossible de créer le rendez-vous:', {
                        clientSuccess: clientResponse?.success,
                        clientMessage: clientResponse?.message,
                        hasDate: !!extractedDate,
                        hasTime: !!extractedTime
                    });
                }
                
            } else {
                console.log("❓ Aucun texte ASR fourni pour les détails utilisateur");
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la gestion des détails utilisateur:', error);
            console.error('❌ Stack trace:', error.stack);
        }

        console.log("➡️ User-details -> next node");
        return nextNodes.length > 0 ? nextNodes[0] : null;
    }
    saveUserDetails = async (userInput, customVars) => {
        try {
            const phoneNumber = customVars?.phone_number;

            if (!phoneNumber) {
                console.error("No phone number available for saving user details");
                return {success: false, error: "No phone number"};
            }
            const userDetails = await this.db['availability'].create({
                phone_number: phoneNumber,
                user_input: userInput,
                call_id: customVars?.call_id,
                workflow_id: customVars?.workflow_id,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date()
            });

            console.log("User details saved:", userDetails);
            return {success: true, userDetails};
        } catch (error) {
            console.error("Error saving user details:", error);
            return {success: false, error: error.message};
        }
    }
    findNodeByLabel = (nodes, label) => {
        console.log(`Searching for node with label: ${label}`);
        let targetNode = nodes.find(n => n.data?.label === label);

        if (targetNode) {
            console.log(`Found exact match for label ${label}: node ${targetNode.id}`);
            return targetNode;
        }

        targetNode = nodes.find(n =>
            n.data?.label?.toLowerCase().includes(label.toLowerCase())
        );

        if (targetNode) {
            console.log(`Found partial match for label ${label}: node ${targetNode.id}`);
            return targetNode;
        }
        targetNode = nodes.find(n =>
            n.id.toLowerCase().includes(label.replace('-', '').toLowerCase())
        );

        if (targetNode) {
            console.log(`Found ID match for label ${label}: node ${targetNode.id}`);
            return targetNode;
        }
        targetNode = nodes.find(n =>
            n.type === 'defaultNode' &&
            n.data?.label === label
        );

        if (targetNode) {
            console.log(`Found defaultNode with label ${label}: node ${targetNode.id}`);
            return targetNode;
        }

        console.log(`No node found for label: ${label}`);
        return null;
    }
    findNodeByType = (nodes, nodeType) => {
        return nodes.find(n =>
            n.type === nodeType ||
            n.node_type === nodeType ||
            n.data?.type === nodeType
        );
    }
    updateplayMusic = async (res, lastestNode, asrText, nodes, edges, nextNodes, record, currentNodeData, currentNodeType) => {
        console.log("Processing STREAM with ASR text:", asrText);


        const call_id = lastestNode.customVars?.call_id || "unknown";

        if (!asrText || asrText.trim() === '') {
            console.log("No ASR text, continuing with default flow");
            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    record
                });
            }
            return this.hangup(res, "NO_NEXT_NODE_AFTER_STREAM", call_id);
        }

        try {
            const targetNode = await this.processMessageIntent(
                asrText,
                nodes,
                edges,
                lastestNode.customVars.node_id,
                lastestNode.customVars.parent_node
            );

            if (targetNode === 'HANGUP') {
                return this.hangup(res, "USER_CANCELLED", call_id);
            }

            if (targetNode) {
                console.log("Using target node from intent:", targetNode.id);
                return this.saveAction(res, {
                    node: targetNode,
                    lastestNode,
                    call_id,
                    asrText,
                    record,
                    nodes,
                    edges
                });
            } else if (nextNodes.length > 0) {
                console.log("Using first next node");
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    asrText,
                    record
                });
            } else {
                console.log("No target node and no next nodes");
                return this.hangup(res, "NO_NEXT_NODE_FOUND", call_id);
            }
        } catch (error) {
            console.error("Error processing message intent:", error);
            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    record
                });
            }
            return this.hangup(res, "ERROR_PROCESSING_INTENT", call_id);
        }
    }
    updateSTREAM = async (res, lastestNode, asrText, nodes, edges, nextNodes, record, currentNode) => {
        console.log("Processing STREAM with ASR text:", asrText);


        const call_id = lastestNode.customVars?.call_id || "unknown";

        if (!asrText || asrText.trim() === '') {
            console.log("No ASR text, continuing with default flow");
            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    record
                });
            }
            return this.hangup(res, "NO_NEXT_NODE_AFTER_STREAM", call_id);
        }

        try {
            const targetNode = await this.processMessageIntent(
                asrText,
                nodes,
                edges,
                lastestNode.customVars.node_id,
                lastestNode.customVars.parent_node
            );

            if (targetNode === 'HANGUP') {
                return this.hangup(res, "USER_CANCELLED", call_id);
            }

            if (targetNode) {
                console.log("Using target node from intent:", targetNode.id);
                return this.saveAction(res, {
                    node: targetNode,
                    lastestNode,
                    call_id,
                    asrText,
                    record,
                    nodes,
                    edges
                });
            } else if (nextNodes.length > 0) {
                console.log("Using first next node");
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    asrText,
                    record
                });
            } else {
                console.log("No target node and no next nodes");
                return this.hangup(res, "NO_NEXT_NODE_FOUND", call_id);
            }
        } catch (error) {
            console.error("Error processing message intent:", error);
            if (nextNodes.length > 0) {
                return this.saveAction(res, {
                    node: nextNodes[0],
                    lastestNode,
                    call_id,
                    record
                });
            }
            return this.hangup(res, "ERROR_PROCESSING_INTENT", call_id);
        }
    }
    constructor() {
        super();
        this.textToSpeechService = new TextToSpeechService();
    }
    getLatestNode = (callID, retry = false) => {
        return new Promise((resolve, reject) => {
            let is_play_dtmf = ` AND step_history.value->>'action' IN ('play', 'getDTMF', 'record') 
                             AND jsonb_typeof(step_history.value->'audio') = 'array'
                             AND jsonb_array_length(step_history.value->'audio') > 0 `;

            let query = `
                SELECT *
                FROM (
                         SELECT pdrv_history.history_id,
                                pdrv_history.workflow_id,
                                step_history.value->'customVars'->>'step' AS step,
                             step_history.value->>'action' AS action,
                             step_history.value->'customVars'->>'call_id' AS call_id,
                             step_history.value->'customVars'->>'node_id' AS node_id,
                             step_history.value
                         FROM pdrv_history,
                             jsonb_array_elements(pdrv_history.flow) AS step_history
                         WHERE step_history.value->'customVars'->>'call_id' = :callId ${retry ? is_play_dtmf : ''}
                     ) AS steps
                ORDER BY (steps.step)::int DESC
                LIMIT 1;
            `;

            const dbConnection = this.db.sequelize["crm-app"] || this.db.sequelize;

            dbConnection.query(query, {
                type: dbConnection.QueryTypes.SELECT,
                replacements: { callId: callID },
            }).then((result) => {
                console.log("Latest node query result:", result);
                resolve(result.length > 0 ? result[0] : {});
            }).catch(error => {
                console.error("Error in getLatestNode:", error);
                reject(error);
            });
        });
    }
    playMusicAction = async (res, data) => {
        let {node, lastestNode, call_id} = data;
        console.log(lastestNode.customVars);
        if (lastestNode.customVars?.parent_node === 'proposition-chat') {
            try {
                console.log("PlayMusic with parent_node proposition-chat - generating dynamic audio");

                const phoneNumber = lastestNode.customVars.phone_number;

                console.log("Retrieved phoneNumber:", phoneNumber);

                if (!phoneNumber) {
                    console.error("No phone_number found in customVars");
                    return this.hangup(res, "PHONE_NUMBER_NOT_FOUND", call_id);
                }

                const user = await this.db.users.findOne({
                    where: {phone_number: phoneNumber}
                });

                if (!user) {
                    console.error("No user found with phone_number:", phoneNumber);
                    return this.hangup(res, "USER_NOT_FOUND", call_id);
                }

                const userId = user.user_id

                console.log("Retrieved userId from phone_number:", userId);

                const mockReq = {
                    body: {
                        userId: userId,
                        refusedDate: lastestNode.customVars?.refusedDate || null
                    }
                };

                console.log("Calling proposeSoonestAvailableDate with:", mockReq.body);
                const audioResponse = await this.proposeSoonestAvailableDate(mockReq);

                console.log("Direct audioResponse from proposeSoonestAvailableDate:", audioResponse);

                if (!audioResponse || !audioResponse.success) {
                    console.error("proposeSoonestAvailableDate returned failure:", audioResponse?.message);
                    return this.hangup(res, "AUDIO_SERVICE_ERROR", call_id);
                }
                const audioData = audioResponse.audioData;

                let audioId;
                if (typeof audioData === 'object' && audioData.efile_id) {
                    audioId = audioData.efile_id;
                } else if (typeof audioData === 'object' && audioData.id) {
                    audioId = audioData.id;
                } else if (typeof audioData === 'string') {
                    audioId = audioData;
                } else {
                    console.error("Cannot extract audioId from audioData:", audioData);
                    return this.hangup(res, "INVALID_AUDIO_DATA", call_id);
                }

                let telcoResponse = {
                    action: "play",
                    audio: [`efile-${audioId}.mp3`],
                    customVars: {
                        ...lastestNode.customVars,
                        label: node.data?.label,
                        step: parseInt(lastestNode.customVars?.step || 0) + 1,
                        call_id: lastestNode.customVars?.call_id || call_id,
                        node_id: node.id,
                        type: node.type,
                        phone_number: lastestNode.customVars?.phone_number,
                        status: 'in_progress',
                        parent_node: lastestNode.customVars?.parent_node,
                        generated_audio_id: audioId,
                        generated_message: audioResponse.message,
                        extracted_date: audioResponse.appointmentDetails?.date,
                        extracted_time: audioResponse.appointmentDetails?.time,
                    }
                };

                console.log("Final telcoResponse:", JSON.stringify(telcoResponse, null, 2));
                return this.saveCallHistoryAction(res, telcoResponse);

            } catch (error) {
                console.error('Error in playMusicAction with proposition-chat:', error);
                return this.hangup(res, `ERROR_PROCESSING_DYNAMIC_AUDIO: ${error.message}`, call_id);
            }
        }
        else if (lastestNode.customVars?.parent_node === 'proposition-client') {
            try {
                console.log("PlayMusic with parent_node proposition-client - checking date availability with text classification");

                const phoneNumber = lastestNode.customVars.phone_number;
                console.log("Custom Variables:", lastestNode.customVars);
                const textToClassify = lastestNode.customVars.asrText;

                console.log("Retrieved phoneNumber:", phoneNumber);
                console.log("Text to classify:", textToClassify);

                if (!phoneNumber) {
                    console.error("No phone_number found in customVars");
                    return this.hangup(res, "PHONE_NUMBER_NOT_FOUND", call_id);
                }

                if (!textToClassify) {
                    console.error("No text to classify found in customVars");
                    console.error("Available customVars:", Object.keys(lastestNode.customVars));
                    return this.hangup(res, "TEXT_TO_CLASSIFY_NOT_FOUND", call_id);
                }

                const user = await this.db.users.findOne({
                    where: {phone_number: phoneNumber}
                });

                if (!user) {
                    console.error("No user found with phone_number:", phoneNumber);
                    return this.hangup(res, "USER_NOT_FOUND", call_id);
                }

                const userId = user.user_id;

                console.log("Retrieved userId from phone_number:", userId);

                const mockReq = {
                    body: {
                        userId: userId,
                        asrText: textToClassify
                    }
                };

                console.log("Calling checkDateAvailability with:", mockReq.body);
                const audioResponse = await this.checkDateAvailability(mockReq);

                console.log("Direct audioResponse from checkDateAvailability:", audioResponse);


                if (!audioResponse || !audioResponse.success) {
                    console.error("proposeSoonestAvailableDate returned failure:", audioResponse?.message);
                    return this.hangup(res, "AUDIO_SERVICE_ERROR", call_id);
                }
                const audioData = audioResponse.audioData;

                let audioId;
                if (typeof audioData === 'object' && audioData.efile_id) {
                    audioId = audioData.efile_id;
                } else if (typeof audioData === 'object' && audioData.id) {
                    audioId = audioData.id;
                } else if (typeof audioData === 'string') {
                    audioId = audioData;
                } else {
                    console.error("Cannot extract audioId from audioData:", audioData);
                    return this.hangup(res, "INVALID_AUDIO_DATA", call_id);
                }

                let telcoResponse = {
                    action: "play",
                    audio: [`efile-${audioId}.mp3`],
                    customVars: {
                        ...lastestNode.customVars,
                        label: node.data?.label,
                        step: parseInt(lastestNode.customVars?.step || 0) + 1,
                        call_id: lastestNode.customVars?.call_id || call_id,
                        node_id: node.id,
                        type: node.type,
                        phone_number: lastestNode.customVars?.phone_number,
                        status: 'in_progress',
                        parent_node: lastestNode.customVars?.parent_node,
                        generated_audio_id: audioId,
                        generated_message: audioResponse.message,
                        original_text: textToClassify,
                        classification_intent: audioResponse.classificationInfo?.intent,
                        classification_probabilities: audioResponse.classificationInfo?.probabilities,
                        extracted_date: audioResponse.appointmentDetails?.date,
                        extracted_time: audioResponse.appointmentDetails?.time,
                        availability_check_result: audioResponse.success,
                        is_available: audioResponse.available || false
                    }
                };

                console.log("Final telcoResponse:", JSON.stringify(telcoResponse, null, 2));
                return this.saveCallHistoryAction(res, telcoResponse);

            } catch (error) {
                console.error('Error in playMusicAction with proposition-client:', error);
                return this.hangup(res, `ERROR_PROCESSING_DATE_AVAILABILITY: ${error.message}`, call_id);
            }


        }else {
            console.log("PlayMusic with normal audio file");

            let telcoResponse = {
                action: "play",
                audio: node.data?.file ? [`efile-${node.data.file}.mp3`] : [],
                customVars: {
                    ...lastestNode.customVars,
                    label: node.data?.label || "Play Music",
                    step: parseInt(lastestNode.customVars?.step || 0) + 1,
                    call_id: lastestNode.customVars?.call_id || call_id,
                    node_id: node.id,
                    type: node.type,
                    phone_number: lastestNode.customVars?.phone_number,
                    status: 'in_progress',
                    parent_node: lastestNode.customVars?.parent_node,

                }
            };

            return this.saveCallHistoryAction(res, telcoResponse);
        }
    };
    processMessageIntent = async (message, nodes, edges, currentNodeId, currentNodeType) => {
        if (!message || message.trim() === '') {
            return null;
        }

        try {
            console.log(`Processing message: "${message}" for node type: ${currentNodeType}`);
            
            // Récupérer le node actuel et déterminer son type/contexte
            const currentNode = this.findCurrentNode(nodes, currentNodeId);
            let detectedNodeType = currentNodeType;
            
            console.log("🔍 DEBUG - Analyzing node:", {
                currentNodeType,
                nodeType: currentNode?.type,
                nodeLabel: currentNode?.data?.label,
                nodeId: currentNode?.id
            });
            
            if (!detectedNodeType || detectedNodeType === 'undefined') {
                // D'abord essayer le label du node
                detectedNodeType = currentNode?.data?.label;
                
                // Si pas de label, essayer le type
                if (!detectedNodeType) {
                    detectedNodeType = currentNode?.type || currentNode?.node_type;
                }
                
                console.log(`🔍 Type détecté depuis le node: ${detectedNodeType}`);
            }
            
            // CORRECTION SPÉCIALE : Si le node est waitDTMF mais avec label user-details
            if (currentNode?.type === 'waitDTMF' && currentNode?.data?.label === 'user-details') {
                detectedNodeType = 'user-details';
                console.log("🎯 CORRECTION: waitDTMF node with user-details label detected!");
            }
            
            // AUTRE CORRECTION : Si le node est dans un contexte parent user-details
            if (currentNode?.data?.parent_node === 'user-details' || 
                currentNode?.customVars?.parent_node === 'user-details') {
                detectedNodeType = 'user-details';
                console.log("🎯 CORRECTION: Node in user-details context detected!");
            }
            
            const classificationResult = await this.classifyIntent(message);

            if (!classificationResult) {
                console.log("No intent classified, using default flow");
                return this.getDefaultNextNode(edges, nodes, currentNodeId);
            }
            console.log("classificationResult:  ",classificationResult)
            const intent = this.extractBestIntent(classificationResult);

            if (!intent) {
                console.log("No valid intent extracted, using default flow");
                return this.getDefaultNextNode(edges, nodes, currentNodeId);
            }

            console.log(`Classified intent: ${intent} from node type: ${detectedNodeType}`);

            const nextNodeIds = edges.filter(edge => edge.source === currentNodeId).map(edge => edge.target);
            const nextNodes = nodes.filter(n => nextNodeIds.includes(n.id));

            switch (detectedNodeType) {
                case 'answer':
                    return await this.handleAnswerNodeIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult);

                case 'proposition-chat':
                    console.log("is hereeeeeeeeeeeee hhhhhhhhhhhhhhhhhhhhhhhhh")
                    return await this.handlePropChatIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult);

                case 'proposition-client':
                    return await this.handlePropClientIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult);

                case 'available-appointment':
                    return await this.handleAvailableAppointmentIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult);

                case 'unavailable-appointment':
                    return await this.handleUnavailableAppointmentIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult);

                case 'user-details':
                    console.log("🎯 GOING TO USER-DETAILS HANDLER!");
                    return await this.handleUserDetailsIntent(intent, nodes, edges, currentNodeId, nextNodes, classificationResult, message, currentNode);

                default:
                    console.log(`Unknown node type: ${detectedNodeType}, using default flow`);
                    return nextNodes.length > 0 ? nextNodes[0] : null;
            }
        } catch (error) {
            console.error("Error in processMessageIntent:", error);
            return this.getDefaultNextNode(edges, nodes, currentNodeId);
        }
    }
    proposeSoonestAvailableDate = async (req, res) => {
        const { userId, refusedDate, availableTimeStart, availableTimeEnd } = req.body;

        if (!userId) {
            const errorResponse = { success: false, message: 'userId is required' };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }

        try {
            const userInfo = await this.db.users.findOne({
                where: { user_id: userId },
                attributes: ['working_hours', 'appointment_duration']
            });

            if (!userInfo || !userInfo.working_hours) {
                const errorResponse = { success: false, message: 'Heures de travail non définies pour cet utilisateur.' };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }

            const appointmentDuration = userInfo.appointment_duration || 60;

            const { Op } = this.db.Sequelize || require('sequelize');

            const bookedAppointments = await this.db.availability.findAll({
                where: {
                    user_id: userId,
                    status: 'Y',
                    type: 'appointment',
                    appointment_date: {
                        [Op.gte]: new Date(),
                    },
                },
                attributes: ['appointment_date', 'start_time', 'end_time'],
                order: [['appointment_date', 'ASC'], ['start_time', 'ASC']],
            });

            console.log("Rendez-vous déjà pris:", bookedAppointments);

            const generateTimeSlots = (workingHours) => {
                const slots = [];
                const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

                daysOfWeek.forEach(day => {
                    if (workingHours[day]?.is_working_day) {
                        const startTime = moment(workingHours[day].start, 'HH:mm');
                        const endTime = moment(workingHours[day].end, 'HH:mm');

                        for (let currentTime = startTime.clone(); currentTime.clone().add(appointmentDuration, 'minutes').isSameOrBefore(endTime); currentTime.add(appointmentDuration, 'minutes')) {
                            slots.push({
                                time: currentTime.format('HH:mm'),
                                day: day
                            });
                        }
                    }
                });

                return slots;
            };

            const timeSlots = generateTimeSlots(userInfo.working_hours);

            const possibleDates = [];
            const startDate = new Date();

            for (let i = 0; i < 30; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dayOfWeek = currentDate.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek];

                timeSlots.forEach(slot => {
                    if (slot.day === dayName) {
                        possibleDates.push({
                            date: currentDate.toISOString().split('T')[0],
                            time: slot.time,
                            day: slot.day
                        });
                    }
                });
            }

            let availableDates = possibleDates.filter(possible => {
                const possibleStart = moment(`${possible.date}T${possible.time}:00`);
                const possibleEnd = possibleStart.clone().add(appointmentDuration, 'minutes');

                const isBooked = bookedAppointments.some(booked => {
                    const bookedDate = new Date(booked.appointment_date).toISOString().split('T')[0];
                    const bookedStart = moment(`${bookedDate}T${booked.start_time}`);
                    const bookedEnd = moment(`${bookedDate}T${booked.end_time}`);

                    return possible.date === bookedDate && possibleStart.isBefore(bookedEnd) && possibleEnd.isAfter(bookedStart);
                });

                const workingHours = userInfo.working_hours[possible.day];
                if (!workingHours || !workingHours.is_working_day) {
                    return false;
                }

                const workingStart = moment(workingHours.start, 'HH:mm');
                const workingEnd = moment(workingHours.end, 'HH:mm');
                const slotTime = moment(possible.time, 'HH:mm');
                const slotEndTime = slotTime.clone().add(appointmentDuration, 'minutes');

                return !isBooked &&
                    slotTime.isSameOrAfter(workingStart) &&
                    slotEndTime.isSameOrBefore(workingEnd);
            });

            if (refusedDate) {
                const refusedDateStr = new Date(refusedDate).toISOString().split('T')[0];
                availableDates = availableDates.filter(slot => slot.date !== refusedDateStr);
            }

            if (availableTimeStart && availableTimeEnd) {
                const startInterval = moment(availableTimeStart, 'HH:mm');
                const endInterval = moment(availableTimeEnd, 'HH:mm');

                availableDates = availableDates.filter(slot => {
                    const slotTime = moment(slot.time, 'HH:mm');
                    return slotTime.isBetween(startInterval, endInterval, null, '[]');
                });
            }

            availableDates.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

            if (availableDates.length === 0) {
                const errorResponse = {
                    success: false,
                    message: 'Aucune date libre trouvée pour les 30 prochains jours.'
                };
                return res ? res.status(404).json(errorResponse) : errorResponse;
            }

            const nextAvailable = availableDates[0];
            const endTime = moment(`${nextAvailable.date}T${nextAvailable.time}:00`).add(appointmentDuration, 'minutes').format('HH:mm');

            const dateText = `Nous avons trouvé un créneau libre le ${moment(nextAvailable.date).format('LL')} de ${nextAvailable.time} à ${endTime} pour prendre votre rendez-vous.`;

            console.log("Prochaine date libre trouvée:", nextAvailable);
            console.log("Durée du rendez-vous:", appointmentDuration, "minutes");
            console.log("Message généré:", dateText);

            let audioResponse = null;
            try {
                const mockReq = { body: { text: dateText } };
                const mockRes = {
                    send: (data) => data,
                    status: (code) => ({ json: (data) => data })
                };
                audioResponse = await this.textToSpeechService.texttospeech(mockReq, mockRes);
            } catch (audioError) {
                console.error('Erreur lors de la génération audio:', audioError);
            }

            const successResponse = {
                success: true,
                audioData: audioResponse,
                message: dateText,
                appointmentDetails: {
                    date: nextAvailable.date,
                    time: nextAvailable.time,
                    duration: appointmentDuration,
                    endTime: endTime
                }
            };

            return res ? res.status(200).json(successResponse) : successResponse;

        } catch (error) {
            console.error('Erreur lors de la recherche des dates libres:', error);
            const errorResponse = {
                success: false,
                message: 'Erreur lors de la recherche des dates disponibles',
                error: error.message
            };
            return res ? res.status(500).json(errorResponse) : errorResponse;
        }
    };
    checkDateAvailability = async (req, res = null) => {
        const { userId, asrText } = req.body;

        if (!userId) {
            const errorResponse = { success: false, message: 'userId est requis' };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }

        if (!asrText) {
            const errorResponse = { success: false, message: 'Le texte à classifier est requis' };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }

        try {
            const classificationResult = await this.classifyIntent(asrText);

            if (!classificationResult) {
                const errorResponse = {
                    success: false,
                    message: 'Erreur lors de la classification du texte'
                };
                return res ? res.status(500).json(errorResponse) : errorResponse;
            }

            console.log("classificationResult:", classificationResult);

            const intent = this.extractBestIntent(classificationResult);

            if (!intent) {
                const errorResponse = {
                    success: false,
                    message: 'Impossible de déterminer l\'intention de votre demande'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }
            if (!classificationResult.datetime) {
                const errorResponse = {
                    success: false,
                    message: 'Aucune information de date/heure trouvée dans votre demande'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }
            const { datetime } = classificationResult;
            const { date, time, date_valid, time_valid, is_past } = datetime;
            if (!date_valid || !time_valid) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: 'Format de date ou d\'heure invalide dans votre demande. Veuillez reformuler avec une date et heure claires.'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }

            if (is_past) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: 'Cette date est déjà passée. Veuillez choisir une date future.'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }
            const dateParts = date.split('-');
            const appointmentDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            const appointmentTime = time;

            console.log("Données extraites de la classification:", {
                originalText: asrText,
                intent: intent,
                probabilities: classificationResult.probabilities,
                originalDate: date,
                convertedDate: appointmentDate,
                time: appointmentTime
            });

            const userInfo = await this.db.users.findOne({
                where: { user_id: userId },
                attributes: ['working_hours', 'appointment_duration']
            });

            if (!userInfo || !userInfo.working_hours) {
                const errorResponse = {
                    success: false,
                    message: 'Heures de travail non définies pour cet utilisateur.'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }

            const appointmentDuration = userInfo.appointment_duration || 60;

            const requestedDate = moment(appointmentDate, 'YYYY-MM-DD');
            const requestedTime = moment(appointmentTime, 'HH:mm');

            if (!requestedDate.isValid() || !requestedTime.isValid()) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: 'Format de date ou d\'heure invalide après conversion. Veuillez reformuler votre demande.'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }

            if (requestedDate.isBefore(moment().startOf('day'))) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: 'Cette date est déjà passée. Veuillez choisir une date future.'
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }
            const dayOfWeek = requestedDate.day();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];

            const workingHours = userInfo.working_hours[dayName];
            if (!workingHours || !workingHours.is_working_day) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: `Cette date n'est pas disponible car nous ne travaillons pas le ${dayName}. Veuillez proposer une autre date.`
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }

            const workingStart = moment(workingHours.start, 'HH:mm');
            const workingEnd = moment(workingHours.end, 'HH:mm');
            const requestedEndTime = requestedTime.clone().add(appointmentDuration, 'minutes');

            if (requestedTime.isBefore(workingStart) || requestedEndTime.isAfter(workingEnd)) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: `L'heure demandée (${appointmentTime}) n'est pas dans nos heures de travail (${workingHours.start} - ${workingHours.end}). Veuillez proposer une autre heure.`
                };
                return res ? res.status(400).json(errorResponse) : errorResponse;
            }
            const { Op } = require('sequelize');

            const bookedAppointments = await this.db.availability.findAll({
                where: {
                    user_id: userId,
                    status: 'Y',
                    type: 'appointment',
                    appointment_date: requestedDate.toDate(),
                },
                attributes: ['appointment_date', 'start_time', 'end_time'],
            });

            const requestedStart = moment(`${appointmentDate}T${appointmentTime}:00`);
            const requestedEnd = requestedStart.clone().add(appointmentDuration, 'minutes');

            const hasConflict = bookedAppointments.some(booked => {
                const bookedStart = moment(`${appointmentDate}T${booked.start_time}`);
                const bookedEnd = moment(`${appointmentDate}T${booked.end_time}`);

                return requestedStart.isBefore(bookedEnd) && requestedEnd.isAfter(bookedStart);
            });

            if (hasConflict) {
                const errorResponse = {
                    success: false,
                    available: false,
                    message: `Ce créneau horaire (${appointmentTime} - ${requestedEndTime.format('HH:mm')}) est déjà occupé. Veuillez choisir une autre heure ou une autre date.`
                };
                return res ? res.status(409).json(errorResponse) : errorResponse;
            }
            const endTime = requestedEndTime.format('HH:mm');
            const dateText = `Le créneau du ${requestedDate.format('LL')} de ${appointmentTime} à ${endTime} est disponible.`;

            console.log("Créneau vérifié:", { date: appointmentDate, time: appointmentTime, available: true });
            console.log("Durée du rendez-vous:", appointmentDuration, "minutes");
            console.log("Message généré:", dateText);
            console.log("Classification utilisée:", classificationResult);

            let audioResponse = null;
            try {
                const mockReq = { body: { text: dateText } };
                const mockRes = {
                    send: (data) => data,
                    status: (code) => ({ json: (data) => data })
                };
                audioResponse = await this.textToSpeechService.texttospeech(mockReq, mockRes);
            } catch (audioError) {
                console.error('Erreur lors de la génération audio:', audioError);
            }

            const successResponse = {
                success: true,
                available: true,
                audioData: audioResponse,
                message: dateText,
                appointmentDetails: {
                    date: appointmentDate,
                    time: appointmentTime,
                    duration: appointmentDuration,
                    endTime: endTime,
                    dayOfWeek: dayName
                },
                classificationInfo: {
                    originalText: asrText,
                    intent: intent,
                    probabilities: classificationResult.probabilities,
                    extractedDatetime: datetime
                }
            };

            return res ? res.status(200).json(successResponse) : successResponse;

        } catch (error) {
            console.error('Erreur lors de la vérification de disponibilité:', error);
            console.error('SQL Error:', error.sql);
            const errorResponse = {
                success: false,
                message: 'Erreur lors de la vérification de la disponibilité',
                error: error.message
            };
            return res ? res.status(500).json(errorResponse) : errorResponse;
        }
    };
    confirmeAvailableDate = async (res, data ,req) => {
        const { userId ,asrText } = req.body;
        let { lastestNode} = data;
        if (!userId) {
            const errorResponse = { success: false, message: 'userId est requis' };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }
        const date = lastestNode.customVars.extracted_date;
        const time = lastestNode.customVars.extracted_time ;

        if (!date || !time) {
            const errorResponse = { success: false, message: 'Date et heure sont requis' };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }

        try {
            const confirmationText = `Je confirme votre rendez-vous pour le ${moment(date).format('LL')} à ${time}?`;

            const classificationResult = await this.classifyIntent(asrText);

            if (!classificationResult) {
                const errorResponse = {
                    success: false,
                    message: 'Erreur lors de la classification du texte de confirmation'
                };
                return res ? res.status(500).json(errorResponse) : errorResponse;
            }
            let audioResponse = null;
            try {
                const mockReq = { body: { text: confirmationText } };
                const mockRes = {
                    send: (data) => data,
                    status: (code) => ({ json: (data) => data })
                };
                audioResponse = await this.textToSpeechService.texttospeech(mockReq, mockRes);
            } catch (audioError) {
                console.error('Erreur lors de la génération audio:', audioError);
            }

            const successResponse = {
                success: true,
                audioData: audioResponse,
                message: confirmationText,
                classificationInfo: {
                    intent: this.extractBestIntent(classificationResult),
                    probabilities: classificationResult.probabilities
                }
            };

            return res ? res.status(200).json(successResponse) : successResponse;

        } catch (error) {
            console.error('Erreur lors de la confirmation de la date:', error);
            const errorResponse = {
                success: false,
                message: 'Erreur lors de la confirmation de la date',
                error: error.message
            };
            return res ? res.status(500).json(errorResponse) : errorResponse;
        }
    };
    checkOrCreateClient = async (req, res = null) => {
        const { phone_number, ...clientData } = req.body;

        if (!phone_number) {
            const errorResponse = {
                success: false,
                message: "Le numéro de téléphone est requis."
            };
            return res ? res.status(400).json(errorResponse) : errorResponse;
        }

        try {
            // Chercher le client existant
            let client = await this.db.clients.findOne({ where: { phone_number } });

            if (client) {
                // Client existe - Mettre à jour les données si elles sont fournies
                if (Object.keys(clientData).length > 0) {
                    await client.update(clientData);
                    await client.reload(); // Recharger pour avoir les données fraîches

                    const updateResponse = {
                        success: true,
                        exists: true,
                        updated: true,
                        message: "Client trouvé et mis à jour avec succès.",
                        client
                    };
                    return res ? res.status(200).json(updateResponse) : updateResponse;
                } else {
                    // Client existe mais pas de nouvelles données à mettre à jour
                    const existsResponse = {
                        success: true,
                        exists: true,
                        updated: false,
                        message: "Le client existe déjà.",
                        client
                    };
                    return res ? res.status(200).json(existsResponse) : existsResponse;
                }
            } else {
                const newClientData = {
                    phone_number,
                    ...clientData
                };

                client = await this.db.clients.create(newClientData);

                const createResponse = {
                    success: true,
                    exists: false,
                    created: true,
                    message: "Nouveau client créé avec succès.",
                    client
                };
                return res ? res.status(201).json(createResponse) : createResponse;
            }

        } catch (error) {
            console.error("Erreur lors de la vérification/création du client :", error);
            const errorResponse = {
                success: false,
                message: "Erreur serveur lors de la gestion du client.",
                error: error.message
            };
            return res ? res.status(500).json(errorResponse) : errorResponse;
        }
    };






}
module.exports = Pdrvbo;