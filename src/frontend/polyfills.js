// Webpack 5 Polyfills for Browser Compatibility
// This file provides necessary polyfills for Node.js modules in browser environment

import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
    window.global = window;
    
    // Process polyfill
    if (!window.process) {
        window.process = {
            env: {},
            nextTick: (fn) => setTimeout(fn, 0),
            version: '',
            platform: 'browser'
        };
    }
}

// Export for module usage
export { Buffer };
export const process = window.process || {
    env: {},
    nextTick: (fn) => setTimeout(fn, 0),
    version: '',
    platform: 'browser'
};