const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../index.html');
console.log('Loading local HTML from:', htmlPath);

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    resources: 'usable',
    beforeParse(window) {
        // Mock canvas getContext
        window.HTMLCanvasElement.prototype.getContext = function() {
            return {
                beginPath() {},
                arc() {},
                fillStyle: '',
                fill() {},
                clearRect() {},
                fillRect() {},
                drawImage() {}
            };
        };

        // Mock localStorage
        const storage = {};
        window.localStorage = {
            getItem(key) { return storage[key] || null; },
            setItem(key, val) { storage[key] = String(val); },
            removeItem(key) { delete storage[key]; },
            clear() { for (let k in storage) delete storage[k]; }
        };
        
        // Mock fetch to return some shopify products or fail safely
        window.fetch = async (url, options) => {
            console.log('[Mock Fetch]', url);
            return {
                json: async () => ({
                    data: {
                        products: {
                            edges: []
                        }
                    }
                })
            };
        };

        // Capture logs and errors
        window.console.log = (...args) => console.log('[Browser Log]', ...args);
        window.console.warn = (...args) => console.warn('[Browser Warn]', ...args);
        window.console.error = (...args) => {
            console.error('[Browser Error]', ...args);
        };
    }
});

console.log('DOM Parsed locally.');
setTimeout(() => {
    const preloader = dom.window.document.getElementById('preloader');
    if (preloader) {
        console.log('Preloader display style:', preloader.style.display);
        console.log('Preloader opacity style:', preloader.style.opacity);
    }
    console.log('Check complete.');
    process.exit(0);
}, 5000);
