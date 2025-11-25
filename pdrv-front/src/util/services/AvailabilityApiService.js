import axios from "axios";
import { apiUrl } from "../../configs/site.config";
import BaseApiService from "./BaseApiService";

class AvailabilityApiService extends BaseApiService {
    constructor() {
        super("availability");
    }

    findAvailability(params = "") {
        return this.setHeaderToken().post(apiUrl + `/availability/find`, params);
    }

    updateAvailability(data) {
        return this.setHeaderToken().put(apiUrl + "/availability/update", data);
    }

    deleteAvailability(params) {
        return this.setHeaderToken().delete(apiUrl + `/availability/delete/${params}`);
    }

    saveAvailability(data) {
        return this.setHeaderToken().post(apiUrl + "/availability/save", data);
    }


    getAvailabilityByUser(user_id, filterParams = {}) {
        const requestBody = {
            ...filterParams,
            user_id: user_id
        };

        return this.setHeaderToken().post(apiUrl + `/availability/find`, requestBody);
    }





}

const availabilityApiService = new AvailabilityApiService();

export default availabilityApiService;