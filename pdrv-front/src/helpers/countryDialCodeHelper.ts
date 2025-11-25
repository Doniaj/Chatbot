// Helper function to convert country codes to abbreviations
export const abreviationCountryDialCode = (countryCode: string): string => {
    // This is a simplified mapping. In a real-world scenario,
    // you'd want a comprehensive mapping of country codes
    const countryCodeMap: { [key: string]: string } = {
        '+1': 'us',    // United States
        '+44': 'gb',   // United Kingdom
        '+91': 'in',   // India
        '+86': 'cn',   // China
        '+33': 'fr',   // France
        '+49': 'de',   // Germany
        '+81': 'jp',   // Japan
        '+61': 'au',   // Australia
        '+7': 'ru',    // Russia
        '+39': 'it',   // Italy
        // Add more country codes as needed
    };

    // Remove any whitespace and ensure the code starts with a '+'
    const normalizedCode = countryCode.trim().startsWith('+')
        ? countryCode.trim()
        : `+${countryCode.trim()}`;

    // Try to find an exact match first
    if (countryCodeMap[normalizedCode]) {
        return countryCodeMap[normalizedCode];
    }

    // If no exact match, try partial matching (useful for variations like '+1-' or '+1 ')
    for (const [code, abbr] of Object.entries(countryCodeMap)) {
        if (normalizedCode.startsWith(code)) {
            return abbr;
        }
    }

    // Fallback to 'unknown' if no match is found
    return 'unknown';
};