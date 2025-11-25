import React, {useState} from "react";
import {Button, Modal} from "react-bootstrap";
import "../../assets/scss/components/skeleton/_loading.css"
interface ConfirmModalProps {
    message: string;
    handleModal: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    textConfirm?: string;
    TextHeader?: string;
    cancelBtn?: boolean;
    block?: boolean;
    blockText?: string;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                       message,
                                                       handleModal,
                                                       onConfirm,
                                                       onCancel,
                                                       textConfirm = 'Confirm',
                                                       TextHeader = 'Confirm',
                                                       cancelBtn = true,
                                                       block = false,
                                                       blockText = 'Confirming...'
                                                   }) => {
    const [enableModal, setEnableModal] = useState<boolean>(handleModal)

    const handleConfirmAction = () => {
        setEnableModal(!enableModal);
        onConfirm();
    }

    const handleCancelAction = () => {
        setEnableModal(!enableModal);
        onCancel();
    }

    return (

        <Modal show={handleModal} id="event-modal" onHide={handleCancelAction} centered>
            <Modal.Header className="p-3" closeButton>
                <Modal.Title>
                    {TextHeader}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {message}
            </Modal.Body>
            <Modal.Footer>
                <div className="hstack gap-2 justify-content-end">
                    {cancelBtn && (<Button variant="soft-danger" type="button" id="btn-delete-event" onClick={() => handleCancelAction()} disabled={block}> Cancel </Button>)}
                    <Button variant="soft-info" type="submit" id="btn-save-event" disabled={block} onClick={() => handleConfirmAction()}> {block ? <div style={{display : 'flex'}}><div id="loading" className="loadingClass"></div>{blockText}</div> : <span>{textConfirm}</span>} </Button>
                </div>
            </Modal.Footer>
        </Modal>

    )
}

export default ConfirmModal