const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const url = 'https://aerion-watch.vercel.app/';
console.log('Loading page in JSDOM from url:', url);

JSDOM.fromURL(url, {
    resources: 'usable', // Load script files and stylesheets
    runScripts: 'dangerously', // Execute script tags
    beforeParse(window) {
        // Mock canvas getContext to avoid GSAP/particles crash
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
        
        // Handle console logs and errors
        window.console.log = (...args) => console.log('[Browser Log]', ...args);
        window.console.warn = (...args) => console.warn('[Browser Warn]', ...args);
        window.console.error = (...args) => {
            console.error('[Browser Error]', ...args);
        };
    }
}).then(dom => {
    console.log('DOM Parsed.');
    
    // Wait for the scripts to load and run (including fetch)
    setTimeout(() => {
        const preloader = dom.window.document.getElementById('preloader');
        if (preloader) {
            console.log('Preloader display style:', preloader.style.display);
            console.log('Preloader opacity style:', preloader.style.opacity);
        } else {
            console.log('Preloader element not found.');
        }
        
        console.log('Check complete.');
        process.exit(0);
    }, 8000); // Wait 8 seconds for network requests and GSAP delays
}).catch(err => {
    console.error('Failed to load page in JSDOM:', err);
    process.exit(1);
});
