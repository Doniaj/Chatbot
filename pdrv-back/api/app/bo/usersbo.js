const {baseModelbo} = require('./basebo');
const jwt = require('jsonwebtoken');
const config = require('../config/config.json');
const Op = require("sequelize/lib/operators");
let db = require('../models');
const moment = require("moment");
const env = process.env.NODE_ENV || 'development';
const {validateEmail} = require("../helpers/helpers");
const AppMail = require('../providers/AppMail');
const TemplateManager = require('../providers/TemplateManagers');
const salt = require("../config/config.json")["salt"]
const bcrypt = require("bcryptjs");
const urlClient = require("../config/config.json")[env]["urlClient"]
const Users = db.users;
const Roles = db.roles;

class users extends baseModelbo {
    constructor() {
        super('users', 'user_id');
        this.baseModal = 'users';
        this.primaryKey = 'user_id'
    }

    verifyToken(req, res, next) {
        let _this = this;
        let {token, user_id} = req.body;
        if (!!!token || !!!user_id) {
            return res.send({
                success: false,
                err: 1,
                data: [],
                message: 'Invalid token',
            });
        }
        jwt.verify(token, config.secret, (err, data) => {
            if (!err) {
                this.db['users'].findOne({
                    where: {
                        user_id: user_id,
                        active: 'Y',
                        status: 'Y',
                        current_session_token: {[Op.not]: null}
                    }
                })
                    .then((result) => {
                        if (result && Object.keys(result).length > 0) {
                            res.send({
                                success: true,
                                data: data,
                                message: 'Valid token',
                            });
                        } else {
                            res.send({
                                success: false,
                                err: 3,
                                data: [],
                                message: 'User Not Found',
                            });
                        }
                    }).catch(err => {
                    return _this.sendResponseError(res, ['Error.AnErrorHasOccurredGetUser', err], 1, 403);
                })
            } else {
                res.send({
                    success: false,
                    err: 4,
                    data: [],
                    message: 'Invalid token',
                });
            }

        });
    }
    login(req, res, next) {
        const {email, password} = req.body;
        if ((!email || !password)) {
            return this.sendResponseError(res, ['Error.RequestDataInvalid'], 0, 403);
        } else {
            this.db['users'].findOne({
                include: [{
                    model: db.roles,
                }],
                where: {
                    email: email,
                    active: 'Y',
                    status: 'Y'
                }
            }).then(user => {
                if (!user) {
                    res.send({
                        success: false,
                        message: 'Email not found',
                    });
                } else {
                    if (user.password_hash && password) {
                        if (user.verifyPassword(password)) {
                            if (!user.is_verified) {
                                return res.send({
                                    message: 'unverified-account',
                                    success: false,
                                    is_verified: false,
                                    result: 1,
                                });
                            }
                            const token = jwt.sign({
                                user_id: user.user_id,
                                email: user.email,
                            }, config.secret, {
                                expiresIn: '8600m'
                            });
                            this.db['users'].update({
                                current_session_token: token,
                                updated_at: moment(new Date())
                            }, {where: {user_id: user.user_id}}).then(() => {
                                return res.send({
                                    message: 'Success',
                                    user: user.toJSON(),
                                    success: true,
                                    token: token,
                                    result: 1,
                                });
                            }).catch(err => {
                                return this.sendResponseError(res, ['cannotUpdateCurrentSessionToken', err], 1, 403)
                            })
                        } else {
                            return res.send({
                                success: false,
                                message: 'Wrong Password!'
                            });
                        }
                    } else {
                        return this.sendResponseError(res, ['Error.InvalidPassword'], 2, 403);
                    }
                }
            }).catch(err => {
                return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser', err], 1, 403);
            })
        }
    }
    getAllUsers(req, res, next) {
        let params = req.body;
        const limit = parseInt(params.limit) > 0 ? params.limit : 1000;
        const page = params.page || 1;
        const offset = (limit * (page - 1));
        let sqlCount = `select count(*)
                        from users as u
                                 left join roles as r on u.role_id = r.role_id
                        where u.active = :active
                          and r.active = :active WHERE_CONDITION`
        let sqlQuery = `select u.*, r.role_name as role
                        from users as u
                                 left join roles as r on u.role_id = r.role_id
                        where u.active = :active
                          and r.active = :active WHERE_CONDITION
                        order by u.user_id desc LIMIT :limit
                        OFFSET :offset`

        let whereCondition = '';
        if (params.meta_key && params.meta_key !== '') {
            if (params.meta_key.length >= 3) {
                whereCondition += ` AND u.username ilike :meta_key`;
            }
        }
        if (params.selectedRole) {
            whereCondition += ` AND r.role_name = :selectedRole`;
        }
        sqlCount = sqlCount.replace('WHERE_CONDITION', whereCondition);
        sqlQuery = sqlQuery.replace('WHERE_CONDITION', whereCondition);
        this.db.sequelize["crm-app"]
            .query(sqlCount, {
                type: this.db.sequelize["crm-app"].QueryTypes.SELECT,
                replacements: {
                    active: 'Y',
                    meta_key: '%' + params.meta_key + '%',
                    selectedRole: params.selectedRole
                }
            }).then(resDataCount => {
            let pages = Math.ceil(resDataCount[0].count / limit);
            this.db.sequelize["crm-app"]
                .query(sqlQuery, {
                    type: this.db.sequelize["crm-app"].QueryTypes.SELECT,
                    replacements: {
                        limit: limit,
                        offset: offset,
                        active: 'Y',
                        meta_key: '%' + params.meta_key + '%',
                        selectedRole: params.selectedRole
                    }
                }).then(resData => {
                res.send({
                    success: true,
                    status: 200,
                    data: resData,
                    pages: pages,
                    countAll: resDataCount[0].count
                })
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotCountUsers'], err)
            })
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGetUsers'], err)
        })
    }
    getCurrentUser(req, res, next) {
        jwt.verify(req.headers.authorization.replace('Bearer ', ''), config.secret, (err, data) => {
            if (data) {
                let user_id = data.user_id;
                this.db['users'].findOne({
                    include: [{
                        model: db.roles,
                    }],
                    where: {
                        user_id: user_id,
                        active: 'Y',
                        status: 'Y'
                    }
                }).then((user) => {
                    if (user) {
                        const prefix = (user.first_name ? user.first_name.charAt(0) : '').toUpperCase() + (user.last_name ? user.last_name.charAt(0) : '');
                        const userData = {
                            user_id: user.user_id,
                            username: user.username,
                            fullname: user.first_name + ' ' + user.last_name,
                            prefix: prefix,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role_id: user.role_id,
                            role: user.role.role_name.toUpperCase(),
                            address: user.address,
                            phone_number: user.phone_number,
                            created_at: user.created_at,
                            is_verified: user.is_verified
                        }
                        res.send({user: userData, success: true})
                    } else {
                        this.sendResponseError(res, ['Error.UserNotFound'], 4, 403);
                    }
                }).catch(err => {
                    console.log(err)
                    this.sendResponseError(res, ['Error.UserNotFound'], 6, 403);
                })
            }
        });
    }
    addUser(req, res, next) {
        const formData = req.body;
        if (
            !!!formData.first_name
            || !!!formData.last_name
            || !!!formData.email
            || !!!formData.role_id
            || !!!formData.password
        ) {
            return this.sendResponseError(res, ['Error.PleaseFillAllRequiredFields'], 0, 403);
        }
        if (!validateEmail(formData.email)) {
            return res.send({
                success: false,
                message: 'invalid email'
            })
        }
        this.db['users'].findOne({
            where: {
                active: 'Y',
                email: formData.email,
            }
        }).then(user_item => {
            if (user_item) {
                return res.send({
                    success: false,
                    message: 'email already exists'
                })
            }
            this.db['roles'].findOne({
                where: {
                    active: 'Y',
                    role_id: formData.role_id
                }
            }).then(role => {
                if (role) {
                    this.generateHash(formData.password, salt).then(hashedObj => {
                        const user = db['users'].build();
                        user.password_hash = hashedObj.hash;
                        user.email = formData.email;
                        user.first_name = formData.first_name;
                        user.last_name = formData.last_name;
                        user.username = formData.username;
                        user.role_id = formData.role_id;
                        user.created_at = formData.created_at
                        user.updated_at = formData.updated_at
                        user.solde = 0
                        user.phone_number = formData.phone_number
                        user.address = formData.address
                        user.status = 'Y'
                        user.country_code = formData.country_code;
                        user.country = formData.country;
                        user.is_verified = false

                        user.save().then(async userSaved => {
                            if (userSaved) {
                                // Initialize response object
                                let response = {
                                    success: true,
                                    user: userSaved,
                                    message: 'Account user created with success!',
                                    email_status: {
                                        welcome_email: { sent: false, error: null },
                                        verification_email: { sent: false, error: null }
                                    }
                                };

                                // Try to send welcome email (non-blocking)
                                try {
                                    const mail = new AppMail({
                                        to: formData.email,
                                        subject: "Bienvenue 🎉",
                                        body: `
                                    <h2>Bonjour ${formData.first_name},</h2>
                                    <p>Votre compte a été créé avec succès sur Fonitex.</p>
                                    <p><b>Email:</b> ${formData.email}</p>
                                    <p><b>Mot de passe:</b> ${formData.password}</p>
                                    <p>Merci de changer votre mot de passe dès votre première connexion.</p>
                                    `
                                    });

                                    const emailResult = await mail.send();
                                    response.email_status.welcome_email = {
                                        sent: emailResult.success,
                                        data: emailResult.success ? emailResult.data : null,
                                        error: emailResult.success ? null : emailResult.error
                                    };
                                } catch (err) {
                                    console.error('Welcome email failed:', err);
                                    response.email_status.welcome_email = {
                                        sent: false,
                                        error: err.message || 'Unknown error'
                                    };
                                }



                                // Always return success for user creation
                                return res.send(response);

                            } else {
                                return this.sendResponseError(res, ['Error.CannotAddUser'], 3, 403);
                            }

                        }).catch((error) => {
                            console.error('User save error:', error);
                            return this.sendResponseError(res, ['Error.AnErrorHasOccuredSaveUser', error], 4, 403);
                        });
                    }).catch(err => {
                        console.error('Hash generation error:', err);
                        return this.sendResponseError(res, ['Error.CannotGenerateHash'], 8, 403);
                    })
                } else {
                    return this.sendResponseError(res, ['Error.FindRoleNotExists'], 5, 403);
                }
            }).catch(err => {
                console.error('Role find error:', err);
                return this.sendResponseError(res, ['Error.FindRole'], 6, 403);
            })
        }).catch((error) => {
            console.error('User find error:', error);
            return this.sendResponseError(res, ['Error.AnErrorHasOccuredUser'], 7, 403);
        });
    }
    updateUser(req, res, next) {
        let params = req.body
        let user_id = params.user_id
        delete params.user_id
        if (!!!user_id || !!!params.email) {
            return this.sendResponseError(res, ['user_id and email are required'], 0, 403)
        }
        if (!validateEmail(params.email)) {
            return res.send({
                success: false,
                message: 'invalid email'
            })
        }
        this.db['users'].findOne({where: {user_id: user_id, active: 'Y'}}).then(user_item => {
            if (user_item) {
                this.db['users'].findOne({
                    where: {
                        active: 'Y',
                        email: params.email,
                        user_id: {[Op.not]: user_id}
                    }
                }).then(user => {
                    if (user) {
                        return res.send({
                            success: false,
                            message: "email already exists !"
                        })
                    } else {
                        delete params['is_verified']
                        if (user_item.email !== params.email) {
                            params['is_verified'] = false
                        }
                        delete params['password']
                        delete params['solde']
                        if (!params['phone_number'] || params['phone_number'] === "") {
                            params['country'] = ""
                            params['country_code'] = ""
                        }
                        this.db["users"].update(params, {where: {user_id: user_id, active: 'Y'}})
                            .then(() => {
                                return res.send({
                                    success: true
                                })
                            }).catch(err => {
                            return this.sendResponseError(res, ['cannot Update User', err], 1, 403)
                        });
                    }
                }).catch(err => {
                    return this.sendResponseError(res, ['cannot Get user', err], 2, 403)
                })
            } else {
                return this.sendResponseError(res, ['cannot Get user'], 3, 403)
            }
        })
    }
    encryptText(text) {
        return btoa(text);
    }
    decryptText(encryptedText) {
        return atob(encryptedText);
    }
    _emailGenerator(data, template_path, userData, subject, verify_account = false) {
        return new Promise(async (resolve, reject) => {
            try {
                const mail = new AppMail({
                    to: userData.email || data.email,
                    subject: subject,
                    body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Hello ${data.name},</h2>
                    ${verify_account ? `
                        <p>Welcome to Fonitex! Please verify your account by clicking the link below:</p>
                        <div style="margin: 30px 0;">
                            <a href="${data.link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Account</a>
                        </div>
                        ${data.password ? `<p><strong>Your temporary password:</strong> ${data.password}</p>` : ''}
                        <p>If you didn't create this account, please ignore this email.</p>
                    ` : `
                        <p>Click the link below to reset your password:</p>
                        <div style="margin: 30px 0;">
                            <a href="${data.link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                        </div>
                    `}
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px;">
                        Need help? Contact our support team at <a href="mailto:${data.support_url}">${data.support_url}</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        You can also <a href="${data.login_url}">login to your account</a> anytime.
                    </p>
                </div>
                `
                });

                const emailResult = await mail.send();

                if (emailResult.success) {
                    return resolve({
                        type: 'success',
                        message: `We've sent you an email with a link to ${verify_account ? "verify your account" : "reset your password"}. Don't forget to check your junk mail folder just in case!`,
                        success: true,
                        email_data: emailResult.data
                    });
                } else {
                    return resolve({
                        status: 403,
                        err: 3,
                        type: 'danger',
                        message: 'Sorry, we couldn\'t send the verification email. Please try again later.',
                        success: false,
                        email_error: emailResult.error
                    });
                }
            } catch (error) {
                console.error('Error in emailGenerator:', error);
                return resolve({
                    status: 500,
                    err: 4,
                    type: 'danger',
                    message: 'An unexpected error occurred while sending the email.',
                    success: false,
                    error: error.message || error
                });
            }
        });
    }
    generateEmail(template_path, email, token_expiration, body_subject) {
        return new Promise((resolve, reject) => {
            if (!email) {
                return reject(false)
            } else {
                this.db['users'].findOne({where: {email: email, active: 'Y'}}).then(user => {
                    if (user) {
                        const token = jwt.sign({}, config.secret, {
                            expiresIn: token_expiration
                        });
                        const CryptedToken = this.encryptText(`token=${token}`)
                        switch (template_path) {
                            case 'VerifyAccount' :
                                this.db['users'].update({
                                    updated_at: moment(new Date()),
                                    token_verify_account: token
                                }, {where: {user_id: user.user_id}}).then(() => {
                                    let data = {
                                        name: user.last_name + ' ' + user.first_name,
                                        link: `${urlClient}verifyAccount?token=${CryptedToken}`,
                                        support_url: "support@Fonitex.com",
                                        login_url: `${urlClient}login`,
                                        email: user.email,
                                        verify_account: true
                                    }
                                    this._emailGenerator(data, template_path, email, body_subject, verify_account).then(result => {
                                        return resolve(result)
                                    })
                                }).catch(err => {
                                    return resolve({
                                        status: 403,
                                        err: err,
                                        type: 'danger',
                                        message: 'Sorry, we\'re having a few technical problems so we can\'t send the email at the moment. Please try again later.',
                                        success: false
                                    })
                                })
                                break;
                            case 'reset':
                                // Create single token with user_id
                                const resetToken = jwt.sign(
                                    { user_id: user.user_id },
                                    config.secret,
                                    { expiresIn: token_expiration }
                                );

                                // Encrypt the same token that gets stored
                                const CryptedToken = this.encryptText(`token=${resetToken}`);

                                this.db['users'].update({
                                    updated_at: moment(new Date()),
                                    token_reset_password: resetToken  // Store the same token
                                }, {where: {user_id: user.user_id}}).then(() => {
                                    let data = {
                                        name: user.last_name + ' ' + user.first_name,
                                        link: `${urlClient}resetPassword?token=${CryptedToken}`,
                                        support_url: "support@Fonitex.com",
                                        login_url: `${urlClient}login`,
                                        email: user.email,
                                        verify_account: false
                                    }
                                    this._emailGenerator(data, template_path, email, "Reset Password Fonitex").then(result => {
                                        return resolve(result)
                                    })
                                }).catch(err => {
                                    return resolve({
                                        status: 403,
                                        type: 'danger',
                                        message: 'Sorry, we\'re having a few technical problems so we can\'t send the email at the moment. Please try again later.',
                                        success: false,
                                        err: err,
                                    })
                                });
                                break;
                        }
                    } else {
                        return resolve({
                            type: 'warning',
                            message: 'No email found Are you certain that your mail is accurate? ',
                            success: false
                        })
                    }
                }).catch(err => {
                    return resolve({
                        status: 403,
                        err: err,
                        type: 'danger',
                        message: 'No user found ! Please try again later. ',
                        success: false
                    })
                })
            }
        })
    }
    _verifyResetPasswordToken(encryptedToken) {
        return new Promise((resolve) => {
            try {
                const decryptedTokenString = this.decryptText(encryptedToken);
                const actualToken = decryptedTokenString.replace('token=', '');
                jwt.verify(actualToken, config.secret, (err, data) => {
                    if (err) {
                        return resolve({
                            success: false,
                            message: 'Invalid or expired token'
                        });
                    }
                    this.db['users'].findOne({
                        where: {
                            user_id: data.user_id,
                            token_reset_password: actualToken,
                            active: 'Y'
                        }
                    }).then(user => {
                        if (user) {
                            resolve({
                                success: true,
                                data: data,
                                message: 'Token valid'
                            });
                        } else {
                            resolve({
                                success: false,
                                message: 'Token not found or user inactive'
                            });
                        }
                    }).catch(() => {
                        resolve({
                            success: false,
                            message: 'Database error'
                        });
                    });
                });
            } catch (error) {
                resolve({
                    success: false,
                    message: 'Token decryption failed'
                });
            }
        });
    }
    resetPassword(req, res) {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.send({ success: false, message: "Token and password required" });
        }

        this._verifyResetPasswordToken(token).then(result => {
            if (!result.success) {
                return res.send({ success: false, message: result.message });
            }

            const data = result.data;

            this.generateHash(password, salt).then(hashedObj => {
                this.db['users'].update({
                    updated_at: moment(new Date()),
                    token_reset_password: null,
                    password_hash: hashedObj.hash
                }, {
                    where: {
                        user_id: data.user_id,
                        active: 'Y'
                    }
                }).then((updateResult) => {
                    if (updateResult[0] === 0) {
                        return res.send({ success: false, message: "User not found or inactive" });
                    }
                    return res.send({ success: true, message: "Password reset successfully" });
                }).catch((err) => {
                    console.error("Password update error:", err);
                    return res.send({ success: false, message: "Failed to update password" });
                });
            }).catch((err) => {
                console.error("Password hashing error:", err);
                return res.send({ success: false, message: "Password hashing failed" });
            });
        }).catch((err) => {
            console.error("Token verification error:", err);
            return res.send({ success: false, message: "Token verification failed" });
        });
    }
    forgotPassword(req, res, next) {
        let {email} = req.body
        if (!email) {
            return this.sendResponseError(res, ['Error.emailIsRequired'], 1, 403)
        }
        this.generateEmail('reset', email, '60m', 'ResetPassword').then(result => {
            return res.send(result)
        }).catch(err => {
            return this.sendResponseError(res, ['Error.AnErrorHasOccured', err], 2, 403)
        })
    }
    generateHash(password, salt) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        salt: salt,
                        password: password,
                        hash: hash
                    });
                }
            });
        });
    }
    verifyResetToken(req, res) {
        const { token } = req.body;
        if (!token) {
            return res.send({ success: false, message: "Token required" });
        }

        this._verifyResetPasswordToken(token).then(result => {
            return res.send(result);
        });
    }
    changePassword(req, res, next) {
        let {oldPassword, user_id, password, updated_at} = req.body
        this.db['users'].findOne({where: {user_id: user_id}}).then(user => {
            if (user.verifyPassword(oldPassword)) {
                this.generateHash(password, salt).then(hashedObj => {
                    this.db['users'].update({
                        password_hash: hashedObj.hash,
                        updated_at: updated_at
                    }, {where: {user_id: user_id}}).then(() => {
                        return res.send({
                            success: true
                        })
                    }).catch(err => {
                        return this.sendResponseError(res, ['Error.CannotUpdateUser'], err)
                    })
                }).catch(err => {
                    return this.sendResponseError(res, ['Error.CannotGeneratePassword'], err)
                })
            } else {
                return res.send({
                    success: false
                })
            }
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotGetUser'], err)
        })
    }
    addWeekWorkingHours(req, res, next) {
        const {user_id, working_hours} = req.body;

        if (!user_id || !working_hours) {
            return this.sendResponseError(res, ['Error.UserIdAndWorkingHoursRequired'], 0, 403);
        }

        if (!this.validateWorkingHoursFormat(working_hours)) {
            return this.sendResponseError(res, ['Error.InvalidWorkingHoursFormat'], 1, 403);
        }

        this.db['users'].findOne({
            where: {
                user_id: user_id,
                active: 'Y'
            }
        }).then(user => {
            if (!user) {
                return this.sendResponseError(res, ['Error.UserNotFound'], 2, 403);
            }

            this.db['users'].update({
                working_hours: working_hours,
                updated_at: moment(new Date())
            }, {
                where: {
                    user_id: user_id
                }
            }).then(() => {
                return res.send({
                    success: true,
                    message: 'Working hours updated successfully'
                });
            }).catch(err => {
                return this.sendResponseError(res, ['Error.CannotUpdateWorkingHours', err], 3, 403);
            });
        }).catch(err => {
            return this.sendResponseError(res, ['Error.CannotFindUser', err], 4, 403);
        });
    }
    validateWorkingHoursFormat(working_hours) {

        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        for (const day of days) {
            if (!working_hours.hasOwnProperty(day)) {
                return false;
            }

            const dayData = working_hours[day];
            if (typeof dayData.is_working_day !== 'boolean') {
                return false;
            }
            if (dayData.is_working_day) {
                if (!dayData.start || !dayData.end) {
                    return false;
                }

                if (!timeRegex.test(dayData.start) || !timeRegex.test(dayData.end)) {
                    return false;
                }
            }
        }

        return true;
    }
    async addAppointmentDuration(req, res, next) {
        try {
            const {user_id, appointment_duration} = req.body;

            if (!user_id || !appointment_duration) {
                return res.status(400).json({
                    success: false,
                    message: "User ID and appointment duration are required"
                });
            }

            // Find the user and update appointment duration
            const user = await Users.findByPk(user_id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Update the appointment duration
            await Users.update(
                {appointment_duration: appointment_duration},
                {where: {user_id: user_id}}
            );

            return res.status(200).json({
                success: true,
                message: "Appointment duration updated successfully"
            });
        } catch (error) {
            console.error("Error adding appointment duration:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }


}


module
    .exports = users;
