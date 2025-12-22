/**
 * Validation Utilities
 * Helper functions for validating user input
 */

const { VALID_EMAIL_DOMAIN, MIN_PASSWORD_LENGTH } = require('../config/constants');

/**
 * Validate email format and domain
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.endsWith(VALID_EMAIL_DOMAIN);
};

/**
 * Validate password length
 */
const validatePassword = (password) => {
    const minLength = MIN_PASSWORD_LENGTH || 6;
    return password.length >= minLength;
};

/**
 * Validate required form fields
 */
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
