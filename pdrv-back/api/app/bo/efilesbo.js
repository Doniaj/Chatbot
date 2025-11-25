const fs = require('fs');
const {baseModelbo} = require('./basebo');
const {appDir} = require("../helpers/app");
const path = require("path");
const axios = require("axios");

class Efilesbo extends baseModelbo {
    constructor() {
        super('efiles', 'file_id');
        this.baseModal = "efiles";
        this.primaryKey = 'file_id';
    }

    upload(req, res, next) {
        if (!req.file) {
            return res.send({msg: 'File not exists'});
        } else {
            console.log(req.file)
            let originalname = req.file.originalname;
            let extension = req.file.originalname.split('.').pop()
            const uri = req.file.destination + req.file.filename + '.' + extension;
            this.db['efiles'].create({
                file_title: req.query.category,
                file_type: req.file.mimetype,
                file_name: req.file.filename,
                original_name: originalname,
                file_size: req.file.size,
                uri,
                created_at: Date.now(),
                updated_at: Date.now(),
                file_extension: extension
            }).then((row) => {
                if (row.file_id) {
                    const new_file_name = 'efile-' + row.file_id + '.' + extension;
                    const file_uri = '/public/upload/audios/' + new_file_name;
                    this.db['efiles'].update({file_name: new_file_name, uri: file_uri},
                        {
                            where: {
                                file_name: req.file.filename
                            }
                        }).then(result => {
                        fs.rename(req.file.path, appDir + '/app/resources/efiles' + file_uri, (err) => {
                            if (err) throw err;
                        });
                    });
                    res.send({
                        success: true,
                        data: {file_id: row.file_id, file_name: new_file_name},
                        messages: ['File uploaded with success']
                    });
                } else {
                    res.send({
                        success: false,
                        messages: ['Error upload file']
                    });
                }
            }).catch(err => {
                res.send({msg: 'Error', detail: err});
            });
        }

    }


    playAudioMusic(req, res, next) {
        let {file_id} = req.body;
        console.log(req.body)
        const dir_audios = path.join(__dirname, "../resources/efiles/");
        this.db['efiles'].findOne({where: {file_id: file_id, active: 'Y'}}).then(async (file) => {
            if (!!!file) {
                return this.sendResponseError(res, ['EfileRequired'], 1, 403)
            }
            let file_url = dir_audios + file.uri;
            try {
                await fs.promises.access(file_url);
                fs.readFile(file_url, function (err, data) {
                    res.sendFile(file_url);
                });
            } catch (error) {
                console.log(error)
                return this.sendResponseError(res, ['cannot.ReadAudio'], 1, 403)
            }
        }).catch(err => {
            return this.sendResponseError(res, ['cannot.FindEfile'], 1, 403)
        })}




    //transfert script par audio


    saveAudio = async (audioBuffer) => {
        return new Promise(async (resolve, reject) => {
            const dateNOW = Date.now()
            const filePath = `/app/resources/efiles/public/upload/audios/processed-${dateNOW}.mp3`;
            await fs.writeFileSync(appDir + filePath, audioBuffer);
            let originalname = `processed-${dateNOW}.mp3`;
            let extension = "mp3"
            const uri = `/public/upload/audios/processed-${dateNOW}.mp3`;
            const fileSize = Buffer.byteLength(audioBuffer);
            this.db['efiles'].create({
                file_title: "",
                file_name: originalname,
                original_name: originalname,
                active: 'Y',
                uri,
                file_extension: extension,
                file_type: 'audio/mpeg',
                file_size: fileSize,
                created_at: Date.now(),
                updated_at: Date.now(),
            }).then((efile) => {
                const file = efile.toJSON();
                if (file.file_id) {
                    const new_file_name = 'efile-' + file.file_id + '.' + extension;
                    const file_uri = '/public/upload/audios/' + new_file_name;
                    this.db['efiles'].update({file_name: new_file_name, uri: file_uri},
                        {
                            where: {
                                file_name: originalname
                            }
                        }).then(result => {
                        fs.rename(appDir + filePath, appDir + '/app/resources/efiles' + file_uri, (err) => {
                            if (err) throw err;
                        });
                        return resolve({success: true, efile_id : file.file_id})
                    }).catch(err => {
                        return resolve({success: false, message: 'catch update file'})
                    })
                } else {
                    return resolve({success: false, message: 'file not saved'})
                }
            }).catch(err => {
                return resolve({success: false, message: 'catch save file'})
            })
        })
    }

    texttospeech = async (req, res) => {
        const text = req.body.text;
        const data = {
            audio_input: { url: 'https://staging-api.fonivoice.com/api/playAudio/efile-2.wav' },
            ref_text_input: "",
            text: text,
            remove_silence: false,
            cross_fade: 0.15,
            slider: 1
        };

        try {
            const result = await axios.post("http://136.243.21.108:2001/api/processF5", data, { responseType: 'arraybuffer' });

            if (result.headers['content-type'] === 'audio/mpeg' || result.headers['content-type'] === 'audio/wav') {
                const audioBuffer = Buffer.from(result.data, 'binary');
                const response_data = await this.saveAudio(audioBuffer);
                return res.send(response_data);
            } else {
                return this.sendResponseError(res, ["UnexpectedResponseF5"], 4, 403);
            }
        } catch (error) {
            return this.sendResponseError(res, ["errorProcess", error.message], 4, 403);
        }
    };

}
    module.exports = Efilesbo;