import BaseApiService from "./BaseApiService";
import {apiUrl} from "../../configs/site.config";

class F5ApiService extends BaseApiService {

    constructor() {
        super('f5');
    }
    processF5(data) {
        return this.setHeaderToken().post(apiUrl + '/f5/processF5', data, data.have_background ? {
            responseType: 'blob'} : {});
    }
}


const f5ApiService = new F5ApiService();

export default f5ApiService;
