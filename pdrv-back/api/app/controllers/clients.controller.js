const ClientDao = require('../bo/clientsbo');
const FreeDocumentAIService = require('../services/extractedDataAIService');
const multer = require('multer');
const path = require('path');

let clientDaoInst = new ClientDao();
const freeDocumentAIService = new FreeDocumentAIService();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/tiff',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, images, and document files are allowed.'));
        }
    }
});

module.exports = {
    update: function (req, res, next) {
        clientDaoInst.update(req, res, next);
    },

    find: function (req, res, next) {
        clientDaoInst.find(req, res, next);
    },

    findById: function (req, res, next) {
        clientDaoInst.findById(req, res, next);
    },

    save: function (req, res, next) {
        clientDaoInst.save(req, res, next);
    },

    delete: function (req, res, next) {
        clientDaoInst.delete(req, res, next);
    },

    uploadMiddleware: upload.single('document'),

    processDocument: async function (req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No document file provided'
                });
            }

            console.log('Processing document with free service:', {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size
            });

            const result = await freeDocumentAIService.processDocument(
                req.file.buffer,
                req.file.mimetype
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process document',
                    error: result.error
                });
            }

            const validation = freeDocumentAIService.validateExtractedData(result.data);

            res.status(200).json({
                success: true,
                message: 'Document processed successfully with free OCR service',
                data: result.data,
                metadata: {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    extractedText: result.fullText ? result.fullText.substring(0, 500) + '...' : '',
                    entitiesFound: result.entities ? result.entities.length : 0,
                    processingMethod: 'Free OCR Service (Tesseract + pdf-parse)',
                    validation: validation,
                    cost: 'Free - No billing charges'
                }
            });

        } catch (error) {
            console.error('Error in processDocument (free service):', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during document processing',
                error: error.message
            });
        }
    },

    saveFromDocument: async function (req, res, next) {
        try {
            let clientData = req.body;

            if (req.file) {
                console.log('Processing document for client creation with free service');

                const extractionResult = await freeDocumentAIService.processDocument(
                    req.file.buffer,
                    req.file.mimetype
                );

                if (extractionResult.success) {
                    const validation = freeDocumentAIService.validateExtractedData(extractionResult.data);

                    if (!validation.isValid) {
                        console.warn('Validation warnings:', validation.errors);
                    }

                    clientData = {
                        ...extractionResult.data,
                        ...clientData, // Manual input overrides extracted data
                        extracted_from_document: true,
                        document_filename: req.file.originalname,
                        extraction_method: 'Free OCR Service'
                    };

                    console.log('Successfully extracted data:', Object.keys(extractionResult.data));
                } else {
                    console.warn('Document extraction failed, using manual data only:', extractionResult.error);
                }
            }

            req.body = clientData;
            clientDaoInst.save(req, res, next);

        } catch (error) {
            console.error('Error in saveFromDocument:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save client',
                error: error.message
            });
        }
    },

    getProcessingHistory: async function (req, res, next) {
        try {
            res.status(200).json({
                success: true,
                message: 'Free document processing is available and ready',
                processingMethod: 'Free OCR Service (Tesseract.js + pdf-parse + mammoth)',
                supportedFormats: [
                    'PDF (.pdf) - Direct text extraction + OCR fallback',
                    'JPEG (.jpg, .jpeg) - OCR processing',
                    'PNG (.png) - OCR processing',
                    'TIFF (.tiff) - OCR processing',
                    'GIF (.gif) - OCR processing',
                    'Word Documents (.docx) - Direct text extraction'
                ],
                maxFileSize: '10MB',
                languages: ['English', 'French', 'Arabic'],
                extractionCapabilities: [
                    'First name and last name extraction',
                    'Phone number extraction (Tunisia focused)',
                    'Birth date extraction (multiple formats)',
                    'Insurance ID extraction',
                    'Address extraction',
                    'Multi-language support'
                ],
                cost: 'Completely Free - No API costs or billing',
                performance: {
                    pdfTextExtraction: 'Very fast (milliseconds)',
                    ocrProcessing: 'Moderate (2-10 seconds)',
                    memoryUsage: 'Reasonable for files under 10MB'
                }
            });
        } catch (error) {
            console.error('Error in getProcessingHistory:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};