import { apiUrl } from "../../configs/site.config";
import BaseApiService from "./BaseApiService";

class NotificationApiService extends BaseApiService {
    constructor() {
        super("notification");
    }

    getNotifications(params = {}) {
        return this.setHeaderToken().post(apiUrl + `/notification/getNotifications`, params);
    }

    getUnreadCount() {
        return this.setHeaderToken().post(apiUrl + `/notification/unread/count`);
    }

    markAsRead(id) {
        return this.setHeaderToken().put(apiUrl + `/notification/${id}/read`);
    }

    markAllAsRead() {
        return this.setHeaderToken().put(apiUrl + `/notification/read/all`);
    }

    deleteNotification(params) {
        return this.setHeaderToken().delete(apiUrl + `/notification/delete/${params}`);
    }

    findNotifications(params = {}) {
        return this.setHeaderToken().post(apiUrl + `/notification/find`, params);
    }



}

const notificationApiService = new NotificationApiService();

export default notificationApiService;