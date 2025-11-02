// Global polyfills for React Native
import 'react-native-get-random-values';

// Node.js polyfills
global.Buffer = require('buffer').Buffer;
global.process = require('process');

// Polyfill for Node.js assert module
if (typeof global.assert === 'undefined') {
  global.assert = require('assert');
}

// Polyfill for Node.js events module
if (typeof global.EventEmitter === 'undefined') {
  global.EventEmitter = require('events').EventEmitter;
}

// Polyfill for Node.js util module
if (typeof global.util === 'undefined') {
  global.util = require('util');
}

// Polyfill for Node.js url module
if (typeof global.URL === 'undefined') {
  const url = require('url');
  global.URL = url.URL;
  global.URLSearchParams = url.URLSearchParams;
}

// Polyfill for Node.js stream module
if (typeof global.Stream === 'undefined') {
  const stream = require('readable-stream');
  global.Stream = stream;
  global.stream = stream;
  
  // Export common stream classes
  global.Readable = stream.Readable;
  global.Writable = stream.Writable;
  global.Transform = stream.Transform;
  global.PassThrough = stream.PassThrough;
}

// Polyfill for Node.js path module
if (typeof global.path === 'undefined') {
  global.path = require('path-browserify');
}

// Polyfill for Node.js querystring module
if (typeof global.querystring === 'undefined') {
  global.querystring = require('querystring-es3');
}

// Polyfill for Node.js os module
if (typeof global.os === 'undefined') {
  global.os = require('os-browserify/browser');
}

if (__DEV__) {
  console.log('🔧 Global polyfills loaded successfully (crypto disabled for compatibility)');
}

if (!__DEV__) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}
