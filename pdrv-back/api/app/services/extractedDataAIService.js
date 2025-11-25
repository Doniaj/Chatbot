const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

class ExtractedDataAIService {
    constructor() {
        this.supportedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/tiff',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
    }

    async processDocument(buffer, mimeType) {
        try {
            console.log(`Processing document with mime type: ${mimeType}`);

            let extractedText = '';

            if (mimeType === 'application/pdf') {
                extractedText = await this.processPDF(buffer);
            } else if (mimeType.startsWith('image/')) {
                extractedText = await this.processImage(buffer);
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extractedText = await this.processDocx(buffer);
            } else if (mimeType === 'application/msword') {
                // For .doc files, you might need additional libraries like antiword
                throw new Error('Legacy .doc files not supported. Please convert to .docx');
            } else {
                throw new Error(`Unsupported mime type: ${mimeType}`);
            }

            const extractedData = this.extractClientData(extractedText);

            return {
                success: true,
                data: extractedData,
                fullText: extractedText,
                entities: this.findEntities(extractedText)
            };

        } catch (error) {
            console.error('Document processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async processPDF(buffer) {
        try {
            const data = await pdf(buffer);
            return data.text;
        } catch (error) {
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    async processImage(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng+fra+ara', {
                logger: m => console.log(m) // Optional: log progress
            });
            return text;
        } catch (error) {
            throw new Error(`Image OCR failed: ${error.message}`);
        }
    }

    async processDocx(buffer) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (error) {
            throw new Error(`DOCX processing failed: ${error.message}`);
        }
    }

    extractClientData(text) {
        const extractedData = {};
        const cleanText = text.replace(/\s+/g, ' ').trim();

        const firstNamePatterns = [
            /(?:prénom|first\s*name|الاسم\s*الأول)[:\s]+([a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+)/i,
            /(?:given\s*name|forename)[:\s]+([a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+)/i
        ];
        for (const pattern of firstNamePatterns) {
            const firstNameMatch = cleanText.match(pattern);
            if (firstNameMatch) {
                extractedData.first_name = firstNameMatch[1].trim();
                break;
            }
        }

        const lastNamePatterns = [
            /(?:nom|last\s*name|nom\s*de\s*famille|اللقب|surname)[:\s]+([a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+)/i,
            /(?:family\s*name)[:\s]+([a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+)/i
        ];
        for (const pattern of lastNamePatterns) {
            const lastNameMatch = cleanText.match(pattern);
            if (lastNameMatch) {
                // on évite les faux positifs
                const name = lastNameMatch[1].toLowerCase();
                if (name !== 'prénom' && name !== 'first' && name !== 'name') {
                    extractedData.last_name = lastNameMatch[1].trim();
                    break;
                }
            }
        }

        // --- Téléphone ---
        const phonePatterns = [
            // Tunisie spécifique
            /(?:phone|tel|téléphone|هاتف|mobile)[:\s]*[\+]?(?:216)?[\s\-]?([2459]\d{7})/i,
            /[\+]?216[\s\-]?([2459]\d{7})/,
            // International
            /(?:phone|tel|téléphone|هاتف|mobile)[:\s]*[\+]?(\d{1,3})[\s\-]?(\d{8,12})/i,
            /[\+]?(\d{1,3})[\s\-]?(\d{8,12})/
        ];
        for (const pattern of phonePatterns) {
            const phoneMatch = cleanText.match(pattern);
            if (phoneMatch) {
                if (phoneMatch[0].includes('216') || phoneMatch[1]?.startsWith('216')) {
                    extractedData.country_code = '216';
                    extractedData.country = 'Tunisia';
                    extractedData.phone_number = phoneMatch[1] || phoneMatch[2];
                } else if (phoneMatch[2]) {
                    extractedData.country_code = phoneMatch[1];
                    extractedData.phone_number = phoneMatch[2];
                } else {
                    extractedData.phone_number = phoneMatch[1];
                }
                break;
            }
        }

        // --- Date de naissance améliorée ---
        extractedData.birthday = this.extractBirthDate(cleanText);


        // --- Assurance ---
        const insurancePatterns = [
            /(?:insurance|assurance|تأمين)[:\s]*(?:id|number|numéro|رقم)[:\s]*([A-Z0-9\-]+)/i,
            /(?:policy|police)[:\s]*(?:number|numéro|رقم)[:\s]*([A-Z0-9\-]+)/i,
            /(?:cnss|cnam|assurance\s*maladie)[:\s]*([A-Z0-9\-]+)/i,
            /(?:id\s*d'assurance|insurance\s*id)[:\s]*([A-Z0-9\-]+)/i
        ];
        for (const pattern of insurancePatterns) {
            const insuranceMatch = cleanText.match(pattern);
            if (insuranceMatch) {
                extractedData.insurance_id = insuranceMatch[1].trim();
                break;
            }
        }

        return extractedData;
    }

    extractBirthDate(text) {
        const monthNames = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
        };

        const datePatterns = [
            // Pattern français spécifique
            /(?:date\s*de\s*naissance)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
            // Patterns existants
            /(?:birth|date\s*of\s*birth|birthday|née?\s*le|تاريخ\s*الميلاد)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
            /(?:birth|date\s*of\s*birth|birthday|née?\s*le|تاريخ\s*الميلاد)[:\s]*(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/i,
            // Format avec mois en lettres
            /(?:birth|date\s*of\s*birth|birthday|née?\s*le|date\s*de\s*naissance|تاريخ\s*الميلاد)[:\s]*(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i
        ];

        for (const pattern of datePatterns) {
            const dateMatch = text.match(pattern);
            if (dateMatch) {
                let day, month, year;

                // Format avec mois en lettres
                if (monthNames[dateMatch[2]?.toLowerCase()]) {
                    day = dateMatch[1].padStart(2, '0');
                    month = monthNames[dateMatch[2].toLowerCase()];
                    year = dateMatch[3];
                }
                // Format DD/MM/YYYY (français standard)
                else if (dateMatch[3] && dateMatch[3].length === 4) {
                    day = dateMatch[1].padStart(2, '0');
                    month = dateMatch[2].padStart(2, '0');
                    year = dateMatch[3];
                }
                // Format YYYY/MM/DD
                else if (dateMatch[1].length === 4) {
                    year = dateMatch[1];
                    month = dateMatch[2].padStart(2, '0');
                    day = dateMatch[3].padStart(2, '0');
                }

                if (day && month && year) {
                    const date = new Date(year, month - 1, day);
                    if (date.getFullYear() == year &&
                        date.getMonth() == month - 1 &&
                        date.getDate() == day &&
                        year >= 1900 && year <= new Date().getFullYear()) {
                        return `${year}-${month}-${day}`;
                    }
                }
            }
        }

        return null;
    }

    extractAddress(text) {
        const addressPatterns = [
            /(?:address|adresse|العنوان)[:\s]*([^\n]+(?:\n[^\n:]+)*?)(?=\n|$)/i,
            /(\d+[^\n,]*(?:rue|avenue|av|street|st|impasse)[^\n,]*(?:,\s*\d{4}[^\n,]*)?)/i,
            /([^\n]*\b\d{4}\s*[a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+[^\n]*)/i
        ];

        for (const pattern of addressPatterns) {
            const addressMatch = text.match(pattern);
            if (addressMatch) {
                let address = addressMatch[1].trim();
                // Nettoyer l'adresse
                address = address.replace(/\s+/g, ' ');
                // Éviter les faux positifs trop courts
                if (address.length > 10) {
                    return address;
                }
            }
        }

        return null;
    }

    findEntities(text) {
        const entities = [];

        // Noms de personnes
        const nameMatches = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
        if (nameMatches) {
            nameMatches.forEach(name => {
                entities.push({ type: 'PERSON', value: name });
            });
        }

        // Numéros de téléphone
        const phoneMatches = text.match(/[\+]?\d{1,3}[\s\-]?\d{8,12}/g);
        if (phoneMatches) {
            phoneMatches.forEach(phone => {
                entities.push({ type: 'PHONE_NUMBER', value: phone });
            });
        }

        // Dates
        const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g);
        if (dateMatches) {
            dateMatches.forEach(date => {
                entities.push({ type: 'DATE', value: date });
            });
        }


        return entities;
    }

    validateExtractedData(data) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Validation du prénom
        if (data.first_name) {
            if (data.first_name.length < 2) {
                validation.errors.push('First name too short');
                validation.isValid = false;
            }
            if (!/^[a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+$/.test(data.first_name)) {
                validation.warnings.push('First name contains unusual characters');
            }
        }

        // Validation du nom
        if (data.last_name) {
            if (data.last_name.length < 2) {
                validation.errors.push('Last name too short');
                validation.isValid = false;
            }
            if (!/^[a-zA-Zàâäéèêëïîôùûüÿñç\u0600-\u06FF]+$/.test(data.last_name)) {
                validation.warnings.push('Last name contains unusual characters');
            }
        }

        // Validation du téléphone
        if (data.phone_number) {
            const phoneRegex = /^\d{8,12}$/;
            if (!phoneRegex.test(data.phone_number.replace(/[\s\-]/g, ''))) {
                validation.errors.push('Invalid phone number format');
                validation.isValid = false;
            }
        }

        if (data.birthday) {
            const date = new Date(data.birthday);
            if (isNaN(date.getTime())) {
                validation.errors.push('Invalid date format');
                validation.isValid = false;
            } else {
                const today = new Date();
                const age = today.getFullYear() - date.getFullYear();
                if (age > 120 || age < 0) {
                    validation.errors.push('Invalid birth date - age out of reasonable range');
                    validation.isValid = false;
                }
            }
        }


        return validation;
    }
}

module.exports = ExtractedDataAIService;