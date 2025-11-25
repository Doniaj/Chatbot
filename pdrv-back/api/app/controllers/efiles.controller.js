const efilesDao = require('../bo/efilesbo');
const fs = require("fs");
let efilesDaoInst = new efilesDao;

module.exports = {
    update: function (req, res, next) {
        efilesDaoInst.update(req, res, next)
    },
    find: function (req, res, next) {
        efilesDaoInst.find(req, res, next);
    },
    findById: function (req, res, next) {
        efilesDaoInst.findById(req, res, next);
    },
    save: function (req, res, next) {
        efilesDaoInst.save(req, res, next);
    },
    delete: function (req, res, next) {
        efilesDaoInst.delete(req, res, next);
    },
    upload: function (req, res, next) {
        efilesDaoInst.upload(req, res, next);
    },
    playAudioMusic(req, res, next) {
        efilesDaoInst.playAudioMusic(req, res, next);
    },
    textToSpeech:function(req, res, next){
        efilesDaoInst.texttospeech(req, res, next);
    }
}

