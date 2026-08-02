const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const IGNORE_LIST = ['node_modules', '.git', 'dist', '.env', 'build.js', 'netlify.toml', 'package.json', 'package-lock.json', '.gitignore', '.vercel', 'vercel.json'];

// Load .env locally if present
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.replace(/\\n/gm, '\n');
            }
            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Create dist directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function(childItemName) {
            if (!IGNORE_LIST.includes(childItemName)) {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            }
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy everything to dist (except ignored)
fs.readdirSync(ROOT_DIR).forEach(item => {
    if (!IGNORE_LIST.includes(item)) {
        copyRecursiveSync(path.join(ROOT_DIR, item), path.join(DIST_DIR, item));
    }
});

// Inject Environment Variables into HTML files
const htmlFiles = ['index.html', 'product.html', 'reset-password.html'];

const defaultEnv = {
    FIREBASE_API_KEY: 'AIzaSyA3sz4I_FZzSSvoKDzpdurxZMPpjRPWx7o',
    FIREBASE_AUTH_DOMAIN: 'aerion-watch.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'aerion-watch',
    FIREBASE_STORAGE_BUCKET: 'aerion-watch.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '547423352235',
    FIREBASE_APP_ID: '1:547423352235:web:2980f5e26bc5a950a94eee',
    FIREBASE_MEASUREMENT_ID: 'G-GPXBZ7Y1TS'
};

htmlFiles.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        content = content.replace(/__FIREBASE_API_KEY__/g, process.env.FIREBASE_API_KEY || defaultEnv.FIREBASE_API_KEY);
        content = content.replace(/__FIREBASE_AUTH_DOMAIN__/g, process.env.FIREBASE_AUTH_DOMAIN || defaultEnv.FIREBASE_AUTH_DOMAIN);
        content = content.replace(/__FIREBASE_PROJECT_ID__/g, process.env.FIREBASE_PROJECT_ID || defaultEnv.FIREBASE_PROJECT_ID);
        content = content.replace(/__FIREBASE_STORAGE_BUCKET__/g, process.env.FIREBASE_STORAGE_BUCKET || defaultEnv.FIREBASE_STORAGE_BUCKET);
        content = content.replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, process.env.FIREBASE_MESSAGING_SENDER_ID || defaultEnv.FIREBASE_MESSAGING_SENDER_ID);
        content = content.replace(/__FIREBASE_APP_ID__/g, process.env.FIREBASE_APP_ID || defaultEnv.FIREBASE_APP_ID);
        content = content.replace(/__FIREBASE_MEASUREMENT_ID__/g, process.env.FIREBASE_MEASUREMENT_ID || defaultEnv.FIREBASE_MEASUREMENT_ID);

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Injected env vars into ${file}`);
    }
});

console.log('Build completed successfully!');
