/**
 * Polyfills for Jest jsdom environment.
 * File polyfill for attachment-service tests (jsdom lacks full File implementation).
 */

if (typeof globalThis.File === 'undefined' || typeof globalThis.File.prototype?.arrayBuffer !== 'function') {
  globalThis.File = class File {
    constructor(bits, name, options = {}) {
      this._bits = bits;
      this.name = name;
      this.type = options.type || '';
      const chunks = Array.isArray(this._bits) ? this._bits : [this._bits];
      const str = chunks.map((c) => (typeof c === 'string' ? c : String.fromCharCode(...new Uint8Array(c)))).join('');
      this._buffer = Buffer.from(str, 'utf8');
    }
    get size() {
      return this._buffer.length;
    }
    arrayBuffer() {
      return Promise.resolve(
        this._buffer.buffer.slice(this._buffer.byteOffset, this._buffer.byteOffset + this._buffer.byteLength)
      );
    }
  };
}
