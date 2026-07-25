(function() {
    // Default Configurable Thresholds
    const DEFAULT_CONFIG = {
        auth: {
            perDevice: { maxAttempts: 5, windowMs: 60000 },    // 5 attempts per minute per device
            perAccount: { maxAttempts: 3, windowMs: 60000 },   // 3 attempts per minute per account
            backoff: {
                baseDelayMs: 2000,                             // 2 seconds initial delay on failure
                factor: 2,                                     // Double delay on each subsequent failure
                maxDelayMs: 60000                              // Maximum delay of 1 minute
            }
        },
        public: {
            maxAttempts: 30,                                   // 30 requests per minute
            windowMs: 60000
        },
        authenticated: {
            maxAttempts: 100,                                  // 100 requests per minute
            windowMs: 60000
        }
    };

    // Ensure CONFIG is globally accessible and customizable
    window.RATE_LIMIT_CONFIG = Object.assign({}, DEFAULT_CONFIG, window.RATE_LIMIT_CONFIG || {});

    class RateLimiter {
        constructor(config) {
            this.config = config || window.RATE_LIMIT_CONFIG;
            this.storageKey = 'aerion_rate_limits';
        }

        _getState() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : {
                    devices: {},
                    accounts: {},
                    public: [],
                    authenticated: []
                };
            } catch (e) {
                return { devices: {}, accounts: {}, public: [], authenticated: [] };
            }
        }

        _saveState(state) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(state));
            } catch (e) {
                // Ignore storage write blocks
            }
        }

        _cleanupTimestamps(timestamps, windowMs) {
            if (!Array.isArray(timestamps)) return [];
            const now = Date.now();
            return timestamps.filter(t => now - t < windowMs);
        }

        // Check if an auth attempt is allowed (per-device, per-account, and exponential backoff)
        checkAuthLimit(route, email = '') {
            const state = this._getState();
            const now = Date.now();

            // 1. Check Exponential Backoff for this account/email
            if (email) {
                const accKey = `${route}:${email.trim().toLowerCase()}`;
                const accData = state.accounts[accKey];
                if (accData && accData.failures > 0) {
                    const delayExponent = Math.min(accData.failures - 1, 6); // Limit exponent to prevent huge numbers
                    const delay = Math.min(
                        this.config.auth.backoff.baseDelayMs * Math.pow(this.config.auth.backoff.factor, delayExponent),
                        this.config.auth.backoff.maxDelayMs
                    );
                    const timePassed = now - accData.lastAttempt;
                    if (timePassed < delay) {
                        const remainingSec = Math.ceil((delay - timePassed) / 1000);
                        return {
                            allowed: false,
                            reason: `Too many failed attempts for this account. Please wait ${remainingSec}s.`,
                            remainingMs: delay - timePassed
                        };
                    }
                }
            }

            // 2. Check Per-Device rate limit for this route
            if (!state.devices[route]) state.devices[route] = [];
            state.devices[route] = this._cleanupTimestamps(state.devices[route], this.config.auth.perDevice.windowMs);
            if (state.devices[route].length >= this.config.auth.perDevice.maxAttempts) {
                const oldestAttempt = state.devices[route][0];
                const remainingSec = Math.ceil((this.config.auth.perDevice.windowMs - (now - oldestAttempt)) / 1000);
                return {
                    allowed: false,
                    reason: `Too many attempts from this device. Please wait ${remainingSec}s.`,
                    remainingMs: this.config.auth.perDevice.windowMs - (now - oldestAttempt)
                };
            }

            // 3. Check Per-Account rate limit
            if (email) {
                const accKey = `${route}:${email.trim().toLowerCase()}`;
                if (!state.accounts[accKey]) {
                    state.accounts[accKey] = { failures: 0, attempts: [], lastAttempt: 0 };
                }
                if (!Array.isArray(state.accounts[accKey].attempts)) {
                    state.accounts[accKey].attempts = [];
                }
                state.accounts[accKey].attempts = this._cleanupTimestamps(state.accounts[accKey].attempts, this.config.auth.perAccount.windowMs);
                if (state.accounts[accKey].attempts.length >= this.config.auth.perAccount.maxAttempts) {
                    const oldestAttempt = state.accounts[accKey].attempts[0];
                    const remainingSec = Math.ceil((this.config.auth.perAccount.windowMs - (now - oldestAttempt)) / 1000);
                    return {
                        allowed: false,
                        reason: `Too many attempts for this account. Please wait ${remainingSec}s.`,
                        remainingMs: this.config.auth.perAccount.windowMs - (now - oldestAttempt)
                    };
                }
            }

            return { allowed: true };
        }

        // Record a device and account attempt
        recordAuthAttempt(route, email = '') {
            const state = this._getState();
            const now = Date.now();

            if (!state.devices[route]) state.devices[route] = [];
            state.devices[route].push(now);

            if (email) {
                const accKey = `${route}:${email.trim().toLowerCase()}`;
                if (!state.accounts[accKey]) {
                    state.accounts[accKey] = { failures: 0, attempts: [], lastAttempt: 0 };
                }
                if (!Array.isArray(state.accounts[accKey].attempts)) {
                    state.accounts[accKey].attempts = [];
                }
                state.accounts[accKey].attempts.push(now);
                state.accounts[accKey].lastAttempt = now;
            }

            this._saveState(state);
        }

        // Record authentication failure
        recordAuthFailure(route, email = '') {
            if (!email) return;
            const state = this._getState();
            const accKey = `${route}:${email.trim().toLowerCase()}`;
            if (!state.accounts[accKey]) {
                state.accounts[accKey] = { failures: 0, attempts: [], lastAttempt: 0 };
            }
            state.accounts[accKey].failures = (state.accounts[accKey].failures || 0) + 1;
            state.accounts[accKey].lastAttempt = Date.now();
            this._saveState(state);
        }

        // Reset failures on success
        recordAuthSuccess(route, email = '') {
            if (!email) return;
            const state = this._getState();
            const accKey = `${route}:${email.trim().toLowerCase()}`;
            if (state.accounts[accKey]) {
                state.accounts[accKey].failures = 0;
            }
            this._saveState(state);
        }

        // Check public endpoint limits (sliding window)
        checkPublicLimit() {
            const state = this._getState();
            const now = Date.now();

            state.public = this._cleanupTimestamps(state.public, this.config.public.windowMs);
            if (state.public.length >= this.config.public.maxAttempts) {
                const oldestAttempt = state.public[0];
                const remainingSec = Math.ceil((this.config.public.windowMs - (now - oldestAttempt)) / 1000);
                return {
                    allowed: false,
                    reason: `Rate limit exceeded. Please wait ${remainingSec}s before making more requests.`,
                    remainingMs: this.config.public.windowMs - (now - oldestAttempt)
                };
            }

            state.public.push(now);
            this._saveState(state);
            return { allowed: true };
        }

        // Check authenticated actions limits (sliding window)
        checkAuthenticatedLimit() {
            const state = this._getState();
            const now = Date.now();

            state.authenticated = this._cleanupTimestamps(state.authenticated, this.config.authenticated.windowMs);
            if (state.authenticated.length >= this.config.authenticated.maxAttempts) {
                const oldestAttempt = state.authenticated[0];
                const remainingSec = Math.ceil((this.config.authenticated.windowMs - (now - oldestAttempt)) / 1000);
                return {
                    allowed: false,
                    reason: `Action rate limit exceeded. Please wait ${remainingSec}s before trying again.`,
                    remainingMs: this.config.authenticated.windowMs - (now - oldestAttempt)
                };
            }

            state.authenticated.push(now);
            this._saveState(state);
            return { allowed: true };
        }
    }

    // Expose class globally
    window.RateLimiter = RateLimiter;
})();
