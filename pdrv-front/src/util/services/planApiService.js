import BaseApiService from "./BaseApiService";

class PlansApiService extends BaseApiService {

    constructor() {
        super('plan');
    }
}


const plansApiService = new PlansApiService();

export default plansApiService;
