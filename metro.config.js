const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Node.js core module polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  // Node.js core modules
  'assert': require.resolve('assert'),
  'buffer': require.resolve('buffer'),
  'events': require.resolve('events'),
  'stream': require.resolve('readable-stream'),
  'url': require.resolve('url'),
  'util': require.resolve('util'),
  'querystring': require.resolve('querystring-es3'),
  'path': require.resolve('path-browserify'),
  'os': require.resolve('os-browserify/browser'),
  // Disable problematic Node.js modules
  'crypto': false,
  'fs': false,
  'net': false,
  'tls': false,
  'child_process': false,
  'dns': false,
  'http': false,
  'https': false,
  'zlib': false,
};

// Handle .mjs and .cjs files
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs'
];

// Add browser field resolution for better compatibility
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add global polyfills
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 