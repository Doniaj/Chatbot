import {Button, Card, Col, Container, Row, Spinner, Alert} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import React, {useEffect, useState} from "react";
import Breadcrumb from "../../../Common/BreadCrumb";
import {useFormik} from "formik";
import * as Yup from "yup";
import {useLocation, useNavigate} from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css'
import {NotifyError, NotifyInfo, NotifySuccess} from "../../../Common/Toast";
import {abreviationCountryDialCode, GetUserInfo} from "../../../helpers/stringHelper";
import usersApiService from "../../../util/services/UsersApiService";
import withRouter from "../../../Common/withRouter";
import {withTranslation} from "react-i18next";
import moment from "moment";
import masks from "../../../helpers/masksPhoneNumbers.json";
import clientApiService from "../../../util/services/ClientsApiService";

interface ClientInterface {
    id?: null | number;
    admin_id: number;
    first_name: string;
    last_name: string;
    phone_number?: string;
    status?: string;
    active?: string;
    created_at?: moment.Moment;
    updated_at: moment.Moment;
    country_code?: string;
    country?: string;
    birthday?: string | null;
    insurance_id?: string | null;
}

interface ExtractedData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    birthday?: string;
    insurance_id?: string;
    country?: string;
    country_code?: string;
}

const AddEditClient = (props: any) => {
    const currentUser = GetUserInfo();
    const location = useLocation();
    const navigate = useNavigate();
    const [client, setClient] = useState(location.state?.client || null);
    const [blockUI, setBlockUI] = useState<boolean>(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<any>('');
    const [countryAbreviation, setCountryAbreviation] = useState<string>("tn");
    const [phoneValidationError, setPhoneValidationError] = useState<string>('');
    const [countryData, setCountryData] = React.useState({
        countryName: "",
        countryCode: "",
        dialCode: "",
        format: ""
    });

    // Document processing states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processingDocument, setProcessingDocument] = useState<boolean>(false);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [documentError, setDocumentError] = useState<string>('');
    const [showDocumentSection, setShowDocumentSection] = useState<boolean>(false);
    const [documentMetadata, setDocumentMetadata] = useState<any>(null);

    useEffect(() => {
        if (location.state?.client) {
            setClient(location.state.client);
        }
    }, [location.state]);

    function onKeyDown(keyEvent: any) {
        if ((keyEvent.charCode || keyEvent.keyCode) === 13) {
            keyEvent.preventDefault();
        }
    }

    const ClientSchema = Yup.object({
        first_name: Yup.string().required(props.t('add-first-name')),
        last_name: Yup.string().required(props.t('add-last-name')),
        phone_number: Yup.string()
    });

    const initialValues = {
        id: null,
        admin_id: currentUserId,
        first_name: '',
        last_name: '',
        phone_number: '',
        country_code: '',
        country: '',
        status: 'Y',
        active: 'Y',
        birthday: null,
        insurance_id: null
    };

    useEffect(() => {
        getCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUserId && client && Object.keys(client).length > 0) {
            if(client?.phone_number && client?.country_code) {
                const formattedPhone = "+" + client?.country_code + client?.phone_number;

                setPhoneNumber(formattedPhone);
                const countryAbbr = abreviationCountryDialCode(client?.country_code);
                setCountryAbreviation(countryAbbr);

                setCountryData({
                    countryName: client?.country || "",
                    countryCode: countryAbbr || "",
                    dialCode: client?.country_code || "",
                    format: ""
                });
            } else {
                setPhoneNumber("+216");
                setCountryAbreviation("tn");
                setCountryData({
                    countryName: "Tunisia",
                    countryCode: "tn",
                    dialCode: "216",
                    format: ""
                });
            }

            setTimeout(() => {
                validation.setValues({
                    id: client?.id,
                    admin_id: currentUserId,
                    first_name: client?.first_name || '',
                    last_name: client?.last_name || '',
                    phone_number: client?.phone_number || '',
                    country_code: client?.country_code || '',
                    country: client?.country || '',
                    status: client?.status || 'Y',
                    active: client?.active || 'Y',
                    birthday: client?.birthday || null,
                    insurance_id: client?.insurance_id || null
                });
            }, 100);

        } else if (currentUserId) {
            validation.setValues({
                ...initialValues,
                admin_id: currentUserId,
                birthday: null,
                insurance_id: null
            });
        }
    }, [currentUserId, client]);

    const getCurrentUser = async () => {
        try {
            setBlockUI(true);
            const response = await usersApiService.getCurrentUser();

            if (response.data && response.data.user) {
                const userId = response.data.user.user_id;
                setCurrentUserId(userId);
            } else {
                NotifyError(props.t('fail-fetch-user'));
            }
        } catch (error) {
            NotifyError(props.t('fail-fetch-user'));
        } finally {
            setBlockUI(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/tiff',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                setDocumentError(props.t('invalid-file-type'));
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setDocumentError(props.t('file-too-large'));
                return;
            }

            // Additional validation for image files
            if (file.type.startsWith('image/') && file.size < 1024) {
                setDocumentError(props.t('image-file-too-small'));
                return;
            }

            setSelectedFile(file);
            setDocumentError('');
            setExtractedData(null);
            setDocumentMetadata(null);

            // Show file info
            const fileInfo = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            NotifyInfo(`${props.t('file-selected')}: ${fileInfo}`);
        }
    };
    const processDocument = async () => {
        if (!selectedFile) return;

        setProcessingDocument(true);
        setDocumentError('');

        const getProcessingMessage = (fileType: string) => {
            if (fileType === 'application/pdf') {
                return props.t('processing-pdf-document');
            } else if (fileType.startsWith('image/')) {
                return props.t('processing-image-ocr');
            } else if (fileType.includes('word')) {
                return props.t('processing-word-document');
            }
            return props.t('processing-document');
        };

        try {
            const formData = new FormData();
            formData.append('document', selectedFile);

            NotifyInfo(getProcessingMessage(selectedFile.type));

            const response = await clientApiService.processDocument(formData);

            if (response.data && response.data.success) {
                const extractedData = response.data.data;
                const metadata = response.data.metadata;

                setExtractedData(extractedData);
                setDocumentMetadata(metadata);

                const extractedFields = [];
                if (extractedData.first_name) extractedFields.push(props.t('first-name'));
                if (extractedData.last_name) extractedFields.push(props.t('last-name'));
                if (extractedData.phone_number) extractedFields.push(props.t('phone-number'));
                if (extractedData.birthday) extractedFields.push(props.t('birthday'));
                if (extractedData.insurance_id) extractedFields.push(props.t('insurance-id'));

                if (extractedFields.length > 0) {
                    NotifySuccess(
                        `${props.t('document-processed-successfully')} - ${props.t('extracted')}: ${extractedFields.join(', ')}`
                    );
                } else {
                    NotifyInfo(props.t('document-processed-no-data-found'));
                }

                console.log('Processing completed:', {
                    method: metadata.processingMethod,
                    entitiesFound: metadata.entitiesFound,
                    extractedFields: extractedFields.length,
                    fileSize: metadata.fileSize,
                    cost: metadata.cost
                });

            } else {
                setDocumentError(response.data?.message || props.t('document-processing-failed'));
            }
        } catch (error: any) {
            console.error('Document processing error:', error);

            if (error.response?.status === 413) {
                setDocumentError(props.t('file-too-large-server'));
            } else if (error.response?.status === 415) {
                setDocumentError(props.t('unsupported-file-type'));
            } else if (error.code === 'NETWORK_ERROR') {
                setDocumentError(props.t('network-error-try-again'));
            } else {
                setDocumentError(error.response?.data?.message || props.t('document-processing-error'));
            }
        } finally {
            setProcessingDocument(false);
        }
    };
    const applyExtractedData = () => {
        if (!extractedData) return;

        const updatedValues = { ...validation.values };

        if (extractedData.first_name) {
            updatedValues.first_name = extractedData.first_name;
        }
        if (extractedData.last_name) {
            updatedValues.last_name = extractedData.last_name;
        }
        if (extractedData.birthday) {
            updatedValues.birthday = extractedData.birthday;
        }
        if (extractedData.insurance_id) {
            updatedValues.insurance_id = extractedData.insurance_id;
        }

        if (extractedData.phone_number && extractedData.country_code) {
            const formattedPhone = "+" + extractedData.country_code + extractedData.phone_number;
            setPhoneNumber(formattedPhone);

            const countryAbbr = abreviationCountryDialCode(extractedData.country_code);
            setCountryAbreviation(countryAbbr);

            setCountryData({
                countryName: extractedData.country || "",
                countryCode: countryAbbr || "",
                dialCode: extractedData.country_code || "",
                format: ""
            });

            updatedValues.phone_number = extractedData.phone_number;
            updatedValues.country_code = extractedData.country_code;
            updatedValues.country = extractedData.country;
        }

        validation.setValues(updatedValues);

        NotifyInfo(props.t('extracted-data-applied'));
    };

    const clearExtractedData = () => {
        setExtractedData(null);
        setDocumentMetadata(null);
        setSelectedFile(null);
        setDocumentError('');

        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const submitClient = async (clientData: any) => {
        if (!currentUserId) {
            return NotifyError(props.t('no-admin-id'));
        }

        setPhoneValidationError('');

        let processedPhoneNumber = '';
        let processedCountryCode = '';

        if (phoneNumber && phoneNumber !== "" && countryData?.dialCode !== "") {
            if (phoneNumber === "+" + countryData?.dialCode) {
                processedPhoneNumber = '';
                processedCountryCode = '';
            } else {
                processedPhoneNumber = extractPhoneNumber(phoneNumber, countryData.dialCode);
                processedCountryCode = countryData?.dialCode || '';
            }
        }

        if (processedPhoneNumber && processedPhoneNumber.trim() !== '' && processedCountryCode) {
            setBlockUI(true);

            const phoneExists = await checkPhoneNumberExists(
                processedPhoneNumber.trim(),
                processedCountryCode,
                clientData.id
            );

            if (phoneExists) {
                setBlockUI(false);
                setPhoneValidationError(props.t('phone-already-exists'));
                return;
            }
        }

        let finalClientData: ClientInterface = {
            admin_id: currentUserId,
            first_name: clientData?.first_name,
            last_name: clientData?.last_name,
            phone_number: processedPhoneNumber || undefined,
            country_code: processedCountryCode || undefined,
            country: countryData?.countryName || undefined,
            birthday: clientData?.birthday,
            insurance_id: clientData?.insurance_id,
            updated_at: moment(new Date())
        };

        setBlockUI(true);

        try {
            let response;

            if (clientData?.id) {
                finalClientData.id = clientData.id;
                response = await clientApiService.updateClient(finalClientData);
            } else {
                finalClientData.status = 'Y';
                finalClientData.active = 'Y';
                finalClientData.created_at = moment(new Date());
                response = await clientApiService.saveClient(finalClientData);
            }

            setBlockUI(false);
            NotifySuccess(clientData?.id ? props.t('client-updated') : props.t('client-added'));

            setTimeout(() => {
                navigate('/user-management/clients');
            }, 500);
        } catch (error) {
            setBlockUI(false);
            NotifyError(props.t('fail-catch'));
        }
    };

    const extractPhoneNumber = (fullNumber: string, dialCode: string): string => {
        if (!fullNumber || !dialCode) {
            return '';
        }

        const cleanFullNumber = fullNumber.replace(/[\s\-\(\)]/g, '');
        const cleanDialCode = dialCode.replace(/[\s\-\(\)]/g, '');
        const numberWithoutPlus = cleanFullNumber.startsWith('+') ? cleanFullNumber.substring(1) : cleanFullNumber;

        if (numberWithoutPlus.startsWith(cleanDialCode)) {
            const withoutCountryCode = numberWithoutPlus.substring(cleanDialCode.length);
            return withoutCountryCode.trim();
        }

        return cleanFullNumber.trim();
    };

    const checkPhoneNumberExists = async (phoneNumber: string, countryCode: string, currentClientId?: number): Promise<boolean> => {
        if (!phoneNumber || !countryCode || !currentUserId) return false;

        if (phoneNumber.trim() === '') return false;

        try {
            const filterParams = JSON.stringify({
                filter: [
                    {
                        operator: 'and',
                        conditions: [
                            {
                                field: 'admin_id',
                                operator: 'eq',
                                value: currentUserId
                            },
                            {
                                field: 'phone_number',
                                operator: 'eq',
                                value: phoneNumber.trim()
                            },
                            {
                                field: 'country_code',
                                operator: 'eq',
                                value: countryCode
                            }
                        ]
                    }
                ],
                limit: 10,
                offset: 0
            });

            const response = await clientApiService.findClients(filterParams);

            if (response && response.data && response.data.data) {
                const existingClients = response.data.data || [];

                const matchingClients = existingClients.filter((client: any) =>
                    client.phone_number === phoneNumber.trim() &&
                    client.country_code === countryCode
                );

                const filteredClients = currentClientId
                    ? matchingClients.filter((client: any) => client.id !== currentClientId)
                    : matchingClients;

                return filteredClients.length > 0;
            }

            return false;
        } catch (error) {
            console.error("Error checking phone number:", error);
            return false;
        }
    };

    const handlePhoneChange = (value: any, data: any) => {
        setPhoneNumber(value);
        setCountryData({
            countryName: data?.name || "",
            countryCode: data?.countryCode || "",
            dialCode: data?.dialCode || "",
            format: data?.format || ""
        });

        setCountryAbreviation(data?.countryCode || "tn");
        setPhoneValidationError('');
    };

    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: initialValues,
        validationSchema: ClientSchema,
        onSubmit: (values, {setErrors}) => {
            if (phoneNumber && phoneNumber !== "" && countryData?.dialCode !== "") {
                if (phoneNumber === "+" + countryData?.dialCode) {
                    setPhoneNumber("");
                    setCountryData({
                        countryName: "",
                        countryCode: "",
                        dialCode: "",
                        format: ""
                    });
                    values.phone_number = "";
                    values.country_code = "";
                    values.country = "";
                } else {
                    let lenPhoneNumber = phoneNumber.length;
                    const dotCount = countryData?.format ? (countryData.format.split('.').length - 1) : 0;
                    if (dotCount > 0 && lenPhoneNumber < dotCount) {
                        return setErrors({phone_number: `must be in format : ${countryData?.format}`});
                    }

                    const processedPhoneNumber = extractPhoneNumber(phoneNumber, countryData.dialCode);

                    values.phone_number = processedPhoneNumber;
                    values.country_code = countryData?.dialCode || '';
                    values.country = countryData?.countryName || '';
                }
            } else {
                values.phone_number = "";
                values.country_code = "";
                values.country = "";
            }

            submitClient(values);
        }
    });

    return (
        <div className="page-content">
            <Container fluid={true}>
                <Breadcrumb
                    title={client ? props.t(`edit-client`) : props.t(`add-client`)}
                    ParentTitle={props.t(`list-clients`)}
                    LinkParentTitle={`/client-management/clients`}
                    ChildTitle={client ? props.t(`edit-client`) : props.t(`add-client`)}
                    props={props}/>

                <Form className="needs-validation" onKeyDown={onKeyDown} onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                    return false;
                }}>

                    {!client && (
                        <Row className="mb-4">
                            <Card>
                                <Card.Header>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar-sm">
                                                    <div className="avatar-title rounded-circle bg-light text-primary fs-20">
                                                        <i className="bi bi-file-earmark-text"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="card-title mb-1">{props.t('document-extraction')}</h5>
                                                <p className="text-muted mb-0">{props.t('upload-document-extract-info')}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => setShowDocumentSection(!showDocumentSection)}
                                        >
                                            {showDocumentSection ? props.t('hide') : props.t('show')}
                                        </Button>
                                    </div>
                                </Card.Header>

                                {showDocumentSection && (
                                    <Card.Body>
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Form.Label htmlFor="document-upload">
                                                        {props.t('select-document')}
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        id="document-upload"
                                                        accept=".pdf,.jpg,.jpeg,.png,.tiff,.gif,.doc,.docx"
                                                        onChange={handleFileSelect}
                                                        disabled={processingDocument}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        {props.t('supported-formats')}: PDF, Images (JPG, PNG, TIFF, GIF), Word Documents. Max size: 10MB
                                                    </Form.Text>
                                                </div>

                                                {documentError && (
                                                    <Alert variant="danger" className="mb-3">
                                                        {documentError}
                                                    </Alert>
                                                )}

                                                {selectedFile && !extractedData && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                                                            <div>
                                                                <strong>{selectedFile.name}</strong>
                                                                <div className="text-muted small">
                                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={processDocument}
                                                                    disabled={processingDocument}
                                                                    className="me-2"
                                                                >
                                                                    {processingDocument && <Spinner size="sm" animation="border" className="me-2"/>}
                                                                    {processingDocument ? props.t('processing...') : props.t('extract-data')}
                                                                </Button>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    onClick={clearExtractedData}
                                                                    disabled={processingDocument}
                                                                >
                                                                    {props.t('clear')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {extractedData && (
                                                    <div className="mb-3">
                                                        <Alert variant="success">
                                                            <Alert.Heading>
                                                                <i className="bi bi-check-circle-fill me-2"></i>
                                                                {props.t('extraction-complete')}
                                                            </Alert.Heading>

                                                            <div className="mb-3">
                                                                <strong>{props.t('extracted-information')}:</strong>
                                                                <ul className="mt-2 mb-0">
                                                                    {extractedData.first_name && (
                                                                        <li>
                                                                            <i className="bi bi-person me-1"></i>
                                                                            {props.t('first-name')}: <strong>{extractedData.first_name}</strong>
                                                                        </li>
                                                                    )}
                                                                    {extractedData.last_name && (
                                                                        <li>
                                                                            <i className="bi bi-person me-1"></i>
                                                                            {props.t('last-name')}: <strong>{extractedData.last_name}</strong>
                                                                        </li>
                                                                    )}
                                                                    {extractedData.phone_number && (
                                                                        <li>
                                                                            <i className="bi bi-telephone me-1"></i>
                                                                            {props.t('phone-number')}: <strong>+{extractedData.country_code}{extractedData.phone_number}</strong>
                                                                        </li>
                                                                    )}
                                                                    {extractedData.birthday && (
                                                                        <li>
                                                                            <i className="bi bi-calendar me-1"></i>
                                                                            {props.t('birthday')}: <strong>{extractedData.birthday}</strong>
                                                                        </li>
                                                                    )}
                                                                    {extractedData.insurance_id && (
                                                                        <li>
                                                                            <i className="bi bi-card-text me-1"></i>
                                                                            {props.t('insurance-id')}: <strong>{extractedData.insurance_id}</strong>
                                                                        </li>
                                                                    )}
                                                                </ul>

                                                                {/* Show if no data was found */}
                                                                {!extractedData.first_name && !extractedData.last_name &&
                                                                    !extractedData.phone_number && !extractedData.birthday &&
                                                                    !extractedData.insurance_id && (
                                                                        <div className="alert alert-info mt-2 mb-0">
                                                                            <i className="bi bi-info-circle me-1"></i>
                                                                            {props.t('no-client-data-extracted')}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            <div className="d-flex gap-2 mb-3">
                                                                <Button variant="success" onClick={applyExtractedData}>
                                                                    <i className="bi bi-arrow-down-circle me-1"></i>
                                                                    {props.t('apply-to-form')}
                                                                </Button>
                                                                <Button variant="outline-secondary" onClick={clearExtractedData}>
                                                                    <i className="bi bi-x-circle me-1"></i>
                                                                    {props.t('clear')}
                                                                </Button>
                                                            </div>

                                                            {/* Enhanced metadata display */}
                                                            {documentMetadata && (
                                                                <div className="border-top pt-2">
                                                                    <small className="text-muted d-block">
                                                                        <strong>{props.t('processing-details')}:</strong>
                                                                    </small>
                                                                    <small className="text-muted">
                                                                        {props.t('document')}: {documentMetadata.fileName} |
                                                                        {props.t('size')}: {(documentMetadata.fileSize / 1024 / 1024).toFixed(2)} MB |
                                                                        {props.t('entities-found')}: {documentMetadata.entitiesFound} |

                                                                    </small>

                                                                    {/* Validation warnings */}
                                                                    {documentMetadata.validation && !documentMetadata.validation.isValid && (
                                                                        <div className="mt-2">
                                                                            <small className="text-warning">
                                                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                                                {props.t('validation-warnings')}: {documentMetadata.validation.errors.join(', ')}
                                                                            </small>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Alert>
                                                    </div>
                                                )}

                                            </Col>
                                        </Row>
                                    </Card.Body>
                                )}
                            </Card>
                        </Row>
                    )}

                    <Row>
                        <Card>
                            <Card.Header>
                                <div className="d-flex">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm">
                                            <div className="avatar-title rounded-circle bg-light text-primary fs-20">
                                                <i className="bi bi-person"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="card-title mb-1">{props.t(`client-information`)}</h5>
                                        <p className="text-muted mb-0">{props.t('fill-informations-below')}</p>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="first_name">{props.t('first-name')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="first_name"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.first_name || ""}
                                                isInvalid={!!(validation.touched.first_name && validation.errors.first_name)}
                                                disabled={blockUI}
                                            />
                                            {validation.touched.first_name && validation.errors.first_name ? (
                                                <Form.Control.Feedback type="invalid">
                                                    <div>{validation.errors.first_name}</div>
                                                </Form.Control.Feedback>
                                            ) : null}
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="last_name">{props.t('last-name')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="last_name"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.last_name || ""}
                                                isInvalid={!!(validation.touched.last_name && validation.errors.last_name)}
                                                disabled={blockUI}
                                            />
                                            {validation.touched.last_name && validation.errors.last_name ? (
                                                <Form.Control.Feedback type="invalid">
                                                    <div>{validation.errors.last_name}</div>
                                                </Form.Control.Feedback>
                                            ) : null}
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="phone_number">
                                                {props.t('phone-number')}
                                            </Form.Label>
                                            <PhoneInput
                                                country={countryAbreviation}
                                                inputStyle={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderColor: phoneValidationError ? '#dc3545' : undefined
                                                }}
                                                masks={masks}
                                                value={phoneNumber}
                                                onChange={handlePhoneChange}
                                                disabled={blockUI}
                                            />
                                            {phoneValidationError && (
                                                <div className="errorInvalidMessages" style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '0.25rem' }}>
                                                    {phoneValidationError}
                                                </div>
                                            )}
                                            {validation?.errors?.phone_number && !phoneValidationError && (
                                                <div className="errorInvalidMessages">{validation.errors.phone_number}</div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="birthday">{props.t('birthday')}</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="birthday"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.birthday || ""}
                                                disabled={blockUI}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Form.Label htmlFor="insurance_id">{props.t('insurance-id')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="insurance_id"
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                value={validation.values.insurance_id || ""}
                                                disabled={blockUI}/>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                            <div className="text-end mb-3 me-3">
                                <Button type="submit" className="btn btn-success" disabled={blockUI || !!phoneValidationError}>
                                    {blockUI && <Spinner size="sm" animation="border" className="me-2"/>}
                                    {blockUI ? (client ? props.t('editing...') : props.t('adding...')) :
                                        (client ? props.t('edit') : props.t('add'))}
                                </Button>
                            </div>
                        </Card>
                    </Row>
                </Form>
            </Container>
        </div>
    );
};

export default withRouter(withTranslation()(AddEditClient));