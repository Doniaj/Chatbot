import BaseApiService from "./BaseApiService";

class RolesApiService extends BaseApiService {

  constructor() {
    super('role');
  }
}


const rolesApiService = new RolesApiService();

export default rolesApiService;
