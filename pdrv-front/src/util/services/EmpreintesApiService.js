import BaseApiService from "./BaseApiService";
import {apiUrl} from "../../configs/site.config";

class EmpreintesApiService extends BaseApiService {

    constructor() {
        super('empreint');
    }
    findEmpreints(data) {
        return this.setHeaderToken().post(apiUrl + '/empreint/findEmpreints', data);
    }
}


const empreintesApiService = new EmpreintesApiService();

export default empreintesApiService;
