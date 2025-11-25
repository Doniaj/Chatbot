import { apiUrl } from "../../configs/site.config";
import BaseApiService from "./BaseApiService";

class ClientApiService extends BaseApiService {
    constructor() {
        super("client");
    }

    updateClient(data) {
        return this.setHeaderToken().put(apiUrl + "/client/update", data);
    }

    findClients(params = "") {
        return this.setHeaderToken().post(apiUrl + `/client/find`, params);
    }

    saveClient(data) {
        return this.setHeaderToken().post(apiUrl + "/client/save", data);
    }

    getClientById(clientId) {
        return this.setHeaderToken().post(apiUrl + "/client/find", { clientId });
    }

    processDocument(formData) {
        return this.setHeaderToken().post(apiUrl + "/client/process-document", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    saveFromDocument(formData) {
        return this.setHeaderToken().post(apiUrl + "/client/save-from-document", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    getDocumentProcessingInfo() {
        return this.setHeaderToken().get(apiUrl + "/client/document-processing-info");
    }
}

const clientApiService = new ClientApiService();

export default clientApiService;