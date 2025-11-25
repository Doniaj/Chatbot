import axios from "axios";
import {apiUrl} from "../../configs/site.config";

class BaseApiService {

    constructor(entity_name = '') {
        this.entity_name = entity_name;
    }

    find(params = {}) {
        return this.setHeaderToken().post(apiUrl + "/" + this.entity_name + '/find', params);
    }

    findById(entity_id) {

        return this.setHeaderToken().get(apiUrl + "/" + this.entity_name + '/findById/' + entity_id);
    }

    save(data) {
        return this.setHeaderToken().post(apiUrl + "/" + this.entity_name + '/save', data);
    }

    update(data) {
        return this.setHeaderToken().put(apiUrl + "/" + this.entity_name + '/update', data);
    }

    delete(id) {
        return this.setHeaderToken().delete(apiUrl + "/" + this.entity_name + '/delete/' + id);
    }

    verifyToken(params) {
        return this.setHeaderToken().post(apiUrl + '/user/verifyToken', params);
    }

    setHeaderToken() {
        let currentToken = localStorage.getItem('token');
        return axios.create({
            headers: {'Authorization': 'Bearer ' + currentToken}
        });
    };
}

export default BaseApiService;
