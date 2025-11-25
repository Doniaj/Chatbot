let multer = require("multer");
const path = require("path");
let appDir = path.dirname(require.main.filename),
    usersController = require("../controllers/users.controller");
rolesController = require("../controllers/roles.controller");
availabilityController = require("../controllers/availability.controller");
clientController = require("../controllers/clients.controller");
workflowController = require("../controllers/workflow.controller");
efilesController = require("../controllers/efiles.controller");
pdrvWorkflowController = require("../controllers/pdrv.controller");
notificationController = require("../controllers/notification.controller");
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dirType = "callfiles";
        if (file.mimetype === "audio/mpeg") {
            dirType = "audios";
        }
        cb(null, appDir + "/app/resources/efiles/public/upload/" + dirType + "/");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now());
    },
});
let upload = multer({
    storage: storage,
    limits: {
        fileSize: 20000000000
    },
});





let router = require("express").Router();

let apiRouters = function (passport) {
    // ################### USER #####################
    router.post("/api/user/find/:params?", passport.authenticate('jwt', {session: false}), usersController.find);
    router.get("/api/user/findById/:entity_id", passport.authenticate('jwt', {session: false}), usersController.findById);
    router.post("/api/user/updateUser", passport.authenticate('jwt', {session: false}), usersController.updateUser);
    router.post("/api/user/updateUser", passport.authenticate('jwt', {session: false}), usersController.updateUser);
    router.post("/api/user/changePassword", passport.authenticate('jwt', {session: false}), usersController.changePassword);
    router.put("/api/user/update", passport.authenticate('jwt', {session: false}), usersController.update);
    router.delete("/api/user/delete/:params", passport.authenticate('jwt', {session: false}), usersController.delete);
    router.post("/api/user/addUser", passport.authenticate('jwt', {session: false}), usersController.addUser);
    router.post("/api/user/verifyToken", passport.authenticate('jwt', {session: false}), usersController.verifyToken);
    router.post("/api/user/login", usersController.login);
    router.post("/api/user/register", usersController.register);
    router.post("/api/user/verifyTokenParams", usersController.verifyTokenParams);
    router.post("/api/user/getAllUsers", passport.authenticate('jwt', {session: false}), usersController.getAllUsers);
    router.get("/api/user/getCurrentUser", passport.authenticate('jwt', {session: false}), usersController.getCurrentUser);
    router.post("/api/user/addWeekWorkingHours", passport.authenticate('jwt', {session: false}), usersController.addWeekWorkingHours);
    router.post("/api/user/addAppointmentDuration", passport.authenticate('jwt', {session: false}), usersController.addAppointmentDuration);
    router.post("/api/user/forgotPassword", usersController.forgotPassword);
    router.post("/api/user/verifyResetToken", usersController.verifyResetToken);
    router.post("/api/user/resetPassword", usersController.resetPassword);
    // ################### ROLE #####################
    router.post("/api/role/find/:params?", passport.authenticate('jwt', {session: false}), rolesController.find);
    router.get("/api/role/findById/:entity_id", passport.authenticate('jwt', {session: false}), rolesController.findById);
    router.put("/api/role/update", passport.authenticate('jwt', {session: false}), rolesController.update);
    router.delete("/api/role/delete/:params", passport.authenticate('jwt', {session: false}), rolesController.delete);
    router.post("/api/role/save", passport.authenticate('jwt', {session: false}), rolesController.save);

    // ################### AVAILABILITY #####################
    router.post("/api/availability/find/:params?", passport.authenticate('jwt', {session: false}), availabilityController.find);
    router.get("/api/availability/findById/:entity_id", passport.authenticate('jwt', {session: false}), availabilityController.findById);
    router.put("/api/availability/update", passport.authenticate('jwt', {session: false}), availabilityController.update);
    router.delete("/api/availability/delete/:params", passport.authenticate('jwt', {session: false}), availabilityController.delete);
    router.post("/api/availability/save", passport.authenticate('jwt', {session: false}), availabilityController.save);
    // ################### CLIENT #####################
    router.post("/api/client/find/:params?", passport.authenticate('jwt', {session: false}), clientController.find);
    router.get("/api/client/findById/:id", passport.authenticate('jwt', {session: false}), clientController.findById);
    router.put("/api/client/update", passport.authenticate('jwt', {session: false}), clientController.update);
    router.delete("/api/client/delete/:id", passport.authenticate('jwt', {session: false}), clientController.delete);
    router.post("/api/client/save", passport.authenticate('jwt', {session: false}), clientController.save);
    router.post("/api/client/process-document",
        passport.authenticate('jwt', {session: false}),
        clientController.uploadMiddleware,
        clientController.processDocument
    );
    router.post("/api/client/save-from-document",
        passport.authenticate('jwt', {session: false}),
        clientController.uploadMiddleware,
        clientController.saveFromDocument
    );
    router.get("/api/client/document-processing-info",
        passport.authenticate('jwt', {session: false}),
        clientController.getProcessingHistory
    );
    // ################### workflow #####################
    router.post("/api/workflow/save", passport.authenticate('jwt', {session: false}), workflowController.save);
    router.get("/api/workflow/reactFlow/:userId", passport.authenticate('jwt', {session: false}), workflowController.getByUserId);
    router.put("/api/workflow/reactFlow/update", passport.authenticate('jwt', {session: false}), workflowController.update);
    router.post("/api/workflow/reactFlow", passport.authenticate('jwt', {session: false}), pdrvWorkflowController.handleRequest);
    router.delete("/api/workflow/delete/:params", passport.authenticate('jwt', {session: false}), workflowController.delete);

    // ################### EFILES #####################
    router.post("/api/efile/find/:params?", passport.authenticate('jwt', {session: false}), efilesController.find);
    router.get("/api/efile/findById/:entity_id", passport.authenticate('jwt', {session: false}), efilesController.findById);
    router.put("/api/efile/update", passport.authenticate('jwt', {session: false}), efilesController.update);
    router.delete("/api/efile/delete/:params", passport.authenticate('jwt', {session: false}), efilesController.delete);
    router.post("/api/efile/save", passport.authenticate('jwt', {session: false}), efilesController.save);
    router.post("/api/uploadFile", upload.single("file"), efilesController.upload);
    router.post("/api/efile/playAudioMusic", passport.authenticate('jwt', {session: false}), efilesController.playAudioMusic);
    router.post("/api/texttospeech", passport.authenticate('jwt', {session: false}), efilesController.textToSpeech);
    router.post("/api/proposeSoonAvai", passport.authenticate('jwt', {session: false}), pdrvWorkflowController.findAll);
    router.post("/api/upsertClientByPhone", pdrvWorkflowController.upsertClientByPhone);
    // ################### NOTIFICATIONS #####################
    router.post("/api/notification/find/:params?", passport.authenticate('jwt', {session: false}), notificationController.find);
    router.get("/api/notification/findById/:id", passport.authenticate('jwt', {session: false}), notificationController.findById);
    router.post("/api/notification/getNotifications", passport.authenticate('jwt', {session: false}), notificationController.getNotifications);
    router.post("/api/notification/unread/count", passport.authenticate('jwt', {session: false}), notificationController.getUnreadCount);
    router.put("/api/notification/:id/read", passport.authenticate('jwt', {session: false}), notificationController.markAsRead);
    router.put("/api/notification/read/all", passport.authenticate('jwt', {session: false}), notificationController.markAllAsRead);
    router.delete("/api/notification/delete/:params", passport.authenticate('jwt', {session: false}), notificationController.delete);
    router.post("/api/notification/save", passport.authenticate('jwt', {session: false}), notificationController.save);
    return router;
};
module.exports = apiRouters;
