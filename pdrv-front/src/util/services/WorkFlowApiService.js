import BaseApiService from "./BaseApiService";
import axios from "axios";
import { apiUrl } from "../../configs/site.config";

class WorkFlowApiService extends BaseApiService {

    constructor() {
        super('workflow');
    }

    save(workflowData) {
        return this.setHeaderToken().post(apiUrl + "/workflow/save", workflowData);
    }
    deleteWorkflow(id) {
        return this.setHeaderToken().delete(apiUrl + `/workflow/delete/${id}`);
    }

    getWorkflowsByUserId(user_id) {
        return this.setHeaderToken().get(`${apiUrl}/workflow/reactFlow/${user_id}`);
    }

    update(workflowData){
        return this.setHeaderToken().put(apiUrl + "/workflow/reactFlow/update", workflowData);
    }


    uploadAudio(file) {
        return  axios.create().post(apiUrl + "/uploadFile", file);
    }
    playAudioMusic(file_id) {
        return this.setHeaderToken().post(apiUrl + "/efile/playAudioMusic" ,file_id, {
            responseType: "blob"
        });
    }

    texttospeech(data) {
        return this.setHeaderToken().post(
            `${apiUrl}/texttospeech`,
            { text: data }
        );
    }


}

const workflowApiService = new WorkFlowApiService();

export default workflowApiService;
