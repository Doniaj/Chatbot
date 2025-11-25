const getEnvConfig = () => {

    return process.env;
};

const Backend_Server = getEnvConfig().REACT_APP_API_BASE_URL;
const App_Base_URL = getEnvConfig().REACT_APP_BASE_URL;

const siteConfig = {
    App_Base_URL: App_Base_URL,
    is_production: getEnvConfig().IS_PRODUCTION,
    backendServer: Backend_Server,
    siteName: 'PDRV',
    siteCreator: 'Fonitex',
    siteIcon: 'ion-flash',
    apiUrl: getEnvConfig().REACT_APP_API_BASE_URL,
    tz: 'Europe/Paris',
    socketBaseUrl: getEnvConfig().REACT_APP_SOCKET_URL
}

export const apiUrl = siteConfig.apiUrl;
export const tz = siteConfig.tz;
export const apiImageUrl = siteConfig.apiUrl + '/file/thumb/full/';

export default siteConfig;
