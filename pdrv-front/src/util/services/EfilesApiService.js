import BaseApiService from "./BaseApiService";
import {apiUrl} from "../../configs/site.config";

class EfilesApiService extends BaseApiService {
    constructor() {
        super('file');
    }

    upload(data) {
        return this.setHeaderToken().post(apiUrl + '/uploadFile', data);
    }
    deleteFile(file_id) {
        return this.setHeaderToken().delete(apiUrl + '/file/deleteFile/'+ file_id);
    }
}

const efilesApiService = new EfilesApiService();

export default efilesApiService;
