const { VALID_EMAIL_DOMAIN, MIN_PASSWORD_LENGTH } = require('../config/constants');

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.endsWith(VALID_EMAIL_DOMAIN);
};

const validatePassword = (password) => {
    return password.length >= MIN_PASSWORD_LENGTH;
};

const validateFormData = (data, requiredFields) => {
    for (const field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === '') {
            return { valid: false, error: `${field} is required` };
        }
    }
    return { valid: true };
};

module.exports = {
    validateEmail,
    validatePassword,
    validateFormData
};
