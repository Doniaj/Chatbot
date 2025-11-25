import {dialCoutries} from "./dialToCountryCode"

const CryptoJS = require("crypto-js");

export const setCryptedLocalStorage = (key: string, value: any) => {
    let StringifyText = JSON.stringify(value);
    let CryptedText = encrypt(StringifyText);
    localStorage.setItem(key, CryptedText)
}
export const getCrpytedLocalStorage = (key: string) => {
    if (!localStorage.getItem(key)) return {};
    return JSON.parse(decrypt(localStorage.getItem(key)));
}
export const GetUserInfo = () => {
    if (!localStorage.getItem('currentuser')) return {};
    return JSON.parse(decrypt(localStorage.getItem('currentuser')));
}
export const encrypt = (text: string) => {
    let password = "jE2s8rtuHA9q6FRZ"
    if (!text) return ''
    return CryptoJS.AES.encrypt(text, password).toString();
}
export const isUserLoggedIn = () => localStorage.getItem('token')
export const clearUser = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentuser')
}
export const decrypt = (text: string | null) => {
    let password = "jE2s8rtuHA9q6FRZ"
    if (!text) return ''
    const bytes = CryptoJS.AES.decrypt(text, password);
    return bytes.toString(CryptoJS.enc.Utf8);
}
export const formatTime = (input: string | number | null | undefined): string => {
    const seconds = input == null ? 0 : (typeof input === 'string' ? parseInt(input, 10) : input);

    if (isNaN(seconds)) {
        throw new Error("L'entrée n'est pas un nombre valide.");
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = secs.toString().padStart(2, '0');

    return `${formattedHours}h ${formattedMinutes}min ${formattedSeconds}s`;
}
export const PhoneNumbers = (user : any) => {
    if (user?.phone_number && user?.country_code && typeof user?.country_code === 'string') {
        // Explicitly assert that country_code is a valid key of dialCountries
        const countryAbbreviation = dialCoutries[user.country_code as keyof typeof dialCoutries] || null;
        return {
            abv: typeof countryAbbreviation === 'string' ? countryAbbreviation : 'world',
            dialCode: " (+"+user?.country_code+") ",
            phone_number: user?.phone_number,
            name: user?.country,
        };
    } else {
        return null;
    }
};

export const abreviationCountryDialCode = (countryCode: string) => {
    if(countryCode == null || countryCode === '') {
        return 'tn'
    }else{
        return dialCoutries[countryCode as keyof typeof dialCoutries] || 'tn';
    }
}

export const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = uppercase.toLowerCase();
    const digits = '0123456789';
    const allCharacters = uppercase + lowercase + digits;

    let password = '';

    // Ensure at least one uppercase letter
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

    // Ensure at least one lowercase letter
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));

    // Ensure at least one digit
    password += digits.charAt(Math.floor(Math.random() * digits.length));

    // Fill the remaining characters randomly to make the password 8 characters long
    for (let i = password.length; i < 8; i++) {
        password += allCharacters.charAt(Math.floor(Math.random() * allCharacters.length));
    }

    // Shuffle the password to make it more random
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
};

