/**
 * Strict Input Validator
 * Validates inputs against precise schemas to prevent injection and enforce business rules.
 */
class Validator {
    /**
     * @param {string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateEmail(value) {
        if (!value || typeof value !== 'string') return { isValid: false, error: 'Email is required.' };
        if (value.length > 254) return { isValid: false, error: 'Email is too long.' };
        // Standard email regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) return { isValid: false, error: 'Invalid email format.' };
        return { isValid: true };
    }

    /**
     * @param {string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validatePassword(value) {
        if (!value || typeof value !== 'string') return { isValid: false, error: 'Password is required.' };
        if (value.length < 6) return { isValid: false, error: 'Password must be at least 6 characters.' };
        if (value.length > 128) return { isValid: false, error: 'Password is too long.' };
        return { isValid: true };
    }

    /**
     * @param {string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateName(value) {
        if (!value || typeof value !== 'string') return { isValid: false, error: 'Name is required.' };
        const trimmed = value.trim();
        if (trimmed.length < 2) return { isValid: false, error: 'Name must be at least 2 characters.' };
        if (trimmed.length > 100) return { isValid: false, error: 'Name is too long.' };
        // Allow letters, spaces, hyphens, and apostrophes. Add numbers in case people use them.
        if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
            return { isValid: false, error: 'Name contains invalid characters.' };
        }
        return { isValid: true };
    }

    /**
     * @param {string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateSearch(value) {
        if (typeof value !== 'string') return { isValid: false, error: 'Invalid search format.' };
        const trimmed = value.trim();
        if (trimmed.length > 100) return { isValid: false, error: 'Search query is too long.' };
        // Prevent obvious injection characters (e.g., script tags), allow alphanumeric and common punctuation
        if (trimmed.length > 0 && /<[^>]*>/g.test(trimmed)) {
            return { isValid: false, error: 'Search query contains invalid characters.' };
        }
        return { isValid: true };
    }

    /**
     * @param {number|string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateWatchPrice(value) {
        const num = Number(value);
        if (isNaN(num)) return { isValid: false, error: 'Price must be a number.' };
        if (num < 0) return { isValid: false, error: 'Price cannot be negative.' };
        if (num > 10000000) return { isValid: false, error: 'Price exceeds maximum allowed value.' };
        return { isValid: true };
    }

    /**
     * @param {string} value 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateHexColor(value) {
        if (!value || typeof value !== 'string') return { isValid: false, error: 'Color is required.' };
        if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
            return { isValid: false, error: 'Invalid hex color format.' };
        }
        return { isValid: true };
    }

    /**
     * @param {string} value 
     * @param {string} fieldName 
     * @param {number} maxLength 
     * @returns {{isValid: boolean, error?: string}}
     */
    static validateWatchText(value, fieldName = 'Text', maxLength = 1000) {
        if (typeof value !== 'string') return { isValid: false, error: `Invalid format for ${fieldName}.` };
        const trimmed = value.trim();
        if (trimmed.length === 0) return { isValid: false, error: `${fieldName} is required.` };
        if (trimmed.length > maxLength) return { isValid: false, error: `${fieldName} is too long (max ${maxLength} chars).` };
        if (/<[^>]*>/g.test(trimmed)) {
            return { isValid: false, error: `${fieldName} cannot contain HTML tags.` };
        }
        return { isValid: true };
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.Validator = Validator;
}
