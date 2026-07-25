/**
 * Error Handler module
 * Centralizes error logging and sanitizes error messages for the UI.
 */

window.handleAppError = function(error, context = '') {
    // 1. Log the full raw error server-side / in console for debugging
    console.error(`[AppError] ${context ? context + ': ' : ''}`, error);

    // 2. Sanitize and Map the error to a user-friendly message
    let friendlyMessage = "An unexpected error occurred. Please try again later.";
    
    // Extract code if it's a Firebase error, or just use message if it's a standard Error
    const code = error.code || '';
    const message = error.message || '';

    if (code) {
        switch (code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                friendlyMessage = "Invalid email or password.";
                break;
            case 'auth/email-already-in-use':
                friendlyMessage = "An account with this email already exists.";
                break;
            case 'auth/weak-password':
                friendlyMessage = "Your password is too weak. Please use at least 6 characters.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "Please enter a valid email address.";
                break;
            case 'auth/network-request-failed':
                friendlyMessage = "Network error. Please check your connection and try again.";
                break;
            case 'auth/too-many-requests':
                friendlyMessage = "Too many attempts. Please try again later.";
                break;
            case 'auth/requires-recent-login':
                friendlyMessage = "For security reasons, please log in again to perform this action.";
                break;
            default:
                friendlyMessage = "An error occurred with your account. Please contact support.";
        }
    } else if (message.includes('Network') || message.includes('fetch')) {
        friendlyMessage = "Network error. Please check your connection.";
    }

    // 3. Show the sanitized message to the user
    if (window.showToast) {
        window.showToast(friendlyMessage, 'error');
    } else {
        alert(friendlyMessage);
    }
};
