const nodemailer = require("nodemailer");
const { isValidEMail } = require("../helpers/Validators");
// Fix: Load config properly - try multiple ways to ensure it loads
let appConfig;
try {
    appConfig = require("../helpers/app").appConfig;
} catch (error) {
    // Fallback: load config directly
    console.log('Loading config directly due to app helper error:', error.message);
    appConfig = require("../config/config.json");
}

class AppMail {
    constructor(options = {}) {
        // Ensure we have smtp config
        const smtpConfig = this.getSmtpConfig();
        if (!smtpConfig) {
            throw new Error('SMTP configuration not found. Please check your config file.');
        }

        this.subject = options.subject || 'Default subject';
        this.body = options.body || '';
        this.text = options.text || '';
        this.to = options.to || null;
        this.cc = options.cc || null;
        this.from = options.from || smtpConfig.default_from;
        this.from_name = options.from_name || smtpConfig.default_from_name;
        this.file_name = options.file_name || null;
        this.file_path = options.file_path || null;

        // Don't create transporter in constructor - create it in send() method for better error handling
    }

    getSmtpConfig() {
        // Multiple fallback attempts to get SMTP config
        if (appConfig && appConfig.smtp) {
            return appConfig.smtp;
        }

        // Try to load config directly if appConfig failed
        try {
            const config = require("../config/config.json");
            if (config && config.smtp) {
                return config.smtp;
            }
        } catch (error) {
            console.error('Cannot load config.json:', error);
        }

        // Try environment-specific config
        try {
            const env = process.env.NODE_ENV || 'development';
            const config = require("../config/config.json");
            if (config && config[env] && config[env].smtp) {
                return config[env].smtp;
            }
            // If no environment-specific smtp, try global smtp
            if (config && config.smtp) {
                return config.smtp;
            }
        } catch (error) {
            console.error('Cannot load environment config:', error);
        }

        // Last resort: return hardcoded config (use your values)
        console.warn('Using fallback SMTP configuration');
        return {
            host: "smtp.gmail.com",
            port: 465,
            login: "fonitex.noreply@gmail.com",
            password: "pxed fwus ohkx kpyc",
            default_from: "fonitex.noreply@gmail.com",
            default_from_name: "Admin Support"
        };
    }

    // Gmail-optimized send method
    async send() {
        if (!this.to || !isValidEMail(this.to)) {
            console.error('Invalid email address:', this.to);
            return {
                success: false,
                message: "Invalid email address",
                error: "Invalid or missing email address"
            };
        }

        const smtpConfig = this.getSmtpConfig();
        if (!smtpConfig) {
            return {
                success: false,
                message: "SMTP configuration not found",
                error: "Cannot load SMTP settings"
            };
        }

        try {
            console.log('Attempting to send email to:', this.to);
            console.log('SMTP Config:', {
                host: smtpConfig.host,
                port: smtpConfig.port,
                user: smtpConfig.login,
                secure: true
            });

            // FIXED: Changed createTransporter to createTransport
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Use Gmail service instead of generic SMTP
                auth: {
                    user: smtpConfig.login,
                    pass: smtpConfig.password,
                },
                tls: {
                    rejectUnauthorized: false // Allow self-signed certificates
                }
            });

            const mailOptions = {
                from: `"${this.from_name}" <${this.from}>`,
                to: this.to,
                subject: this.subject,
                html: this.body,
                text: this.text || this.body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
            };

            // Add CC if provided
            if (this.cc) {
                mailOptions.cc = this.cc;
            }

            // Add attachments if provided
            if (this.file_name && this.file_path) {
                mailOptions.attachments = [
                    { filename: this.file_name, path: this.file_path }
                ];
            }

            const info = await transporter.sendMail(mailOptions);

            console.log('Email sent successfully:', info.messageId);
            return {
                success: true,
                message: "Email sent successfully",
                data: {
                    messageId: info.messageId,
                    response: info.response,
                    accepted: info.accepted,
                    rejected: info.rejected
                }
            };
        } catch (err) {
            console.error('Email sending error details:', {
                code: err.code,
                response: err.response,
                responseCode: err.responseCode,
                message: err.message,
                command: err.command
            });

            // Gmail-specific error handling
            let errorMessage = "Cannot send email";
            if (err.code === 'EAUTH') {
                errorMessage = "Gmail authentication failed. Please verify your App Password is correct and 2FA is enabled.";
            } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
                errorMessage = "Cannot connect to Gmail servers. Please check your network connection.";
            } else if (err.responseCode === 550) {
                errorMessage = "Email address not found or blocked by Gmail.";
            } else if (err.responseCode === 554) {
                errorMessage = "Email rejected by Gmail. The recipient address may be invalid.";
            } else if (err.message && err.message.includes('daily sending quota exceeded')) {
                errorMessage = "Gmail daily sending limit exceeded. Please try again tomorrow.";
            } else if (err.message && err.message.includes('Too many login attempts')) {
                errorMessage = "Too many login attempts. Please wait and try again later.";
            }

            return {
                success: false,
                message: errorMessage,
                error: {
                    code: err.code,
                    response: err.response,
                    responseCode: err.responseCode,
                    message: err.message,
                    command: err.command
                }
            };
        }
    }


}

module.exports = AppMail;