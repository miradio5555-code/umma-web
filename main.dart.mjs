// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: (x0,x1) => x0.forEach(x1),
      AH: () => Date.now(),
      AI: x0 => x0.offsetWidth,
      AJ: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      AK: x0 => x0.document,
      AL: x0 => x0.close(),
      AM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      AN: (x0,x1) => { x0.loop = x1 },
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.name,
      BH: () => typeof dartUseDateNowForTicks !== "undefined",
      BI: (x0,x1) => { x0.tabIndex = x1 },
      BJ: x0 => x0.maxHeight,
      BK: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      BL: x0 => x0.hostElement,
      BM: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      BN: (x0,x1) => x0.createMediaElementSource(x1),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: x0 => x0.statusText,
      CH: () => 1000 * performance.now(),
      CI: x0 => x0.stopPropagation(),
      CJ: x0 => x0.maxWidth,
      CK: (a, s, e) => a.slice(s, e),
      CL: x0 => x0.location,
      CM: x0 => globalThis.URL.createObjectURL(x0),
      CN: x0 => x0.createStereoPanner(),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.url,
      DH: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      DI: x0 => x0.value,
      DJ: x0 => x0.minHeight,
      DK: x0 => new WeakRef(x0),
      DL: (x0,x1) => x0.getModifierState(x1),
      DM: x0 => x0.size,
      DN: (x0,x1) => { x0.crossOrigin = x1 },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: x0 => x0.status,
      EH: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      EI: x0 => x0.disabled,
      EJ: x0 => x0.minWidth,
      EK: x0 => x0.deref(),
      EL: x0 => x0.metaKey,
      EM: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      EN: (x0,x1) => ({src: x0,sizes: x1}),
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: x0 => x0.getReader(),
      FH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FI: (x0,x1) => { x0.type = x1 },
      FJ: x0 => x0.debugSkipFontRetryDelay,
      FK: () => globalThis.WeakRef,
      FL: x0 => x0.altKey,
      FM: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      FN: (x0,x1,x2,x3) => ({title: x0,artist: x1,album: x2,artwork: x3}),
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.read(),
      GH: x0 => x0.body,
      GI: (x0,x1) => { x0.min = x1 },
      GJ: x0 => x0.status,
      GK: (x0,x1) => x0.revokeObjectURL(x1),
      GL: x0 => x0.ctrlKey,
      GM: x0 => x0.height,
      GN: x0 => new MediaMetadata(x0),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: x0 => x0.value,
      HH: () => globalThis.document,
      HI: (x0,x1) => { x0.max = x1 },
      HJ: x0 => new Uint8Array(x0),
      HK: (x0,x1) => { x0.src = x1 },
      HL: x0 => x0.isComposing,
      HM: x0 => x0.width,
      HN: (x0,x1) => { x0.metadata = x1 },
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.done,
      IH: () => globalThis.window._flutter_skwasmInstance,
      II: (x0,x1) => { x0.value = x1 },
      IJ: (x0,x1,x2) => x0.set(x1,x2),
      IK: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      IL: x0 => x0.code,
      IM: (x0,x1) => x0.getContext(x1),
      IN: x0 => x0.mediaSession,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: x0 => x0.cancel(),
      JH: () => globalThis.window.flutterCanvasKit,
      JI: (x0,x1) => { x0.disabled = x1 },
      JJ: x0 => x0.buffer,
      JK: x0 => x0.naturalHeight,
      JL: x0 => x0.repeat,
      JM: (x0,x1) => { x0.height = x1 },
      JN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: x0 => x0.body,
      KH: () => globalThis.globalThis,
      KI: (x0,x1) => { x0.scrollTop = x1 },
      KJ: x0 => x0.wasmMemory,
      KK: x0 => x0.naturalWidth,
      KL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KM: (x0,x1) => { x0.width = x1 },
      KN: (x0,x1,x2) => x0.setActionHandler(x1,x2),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: x0 => x0.headers,
      LH: x0 => x0.remove(),
      LI: (x0,x1) => { x0.scrollLeft = x1 },
      LJ: () => globalThis.window._flutter_skwasmInstance,
      LK: x0 => x0.decode(),
      LL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      LM: x0 => x0.height,
      LN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: x0 => x0.signal,
      MH: (x0,x1) => x0.querySelectorAll(x1),
      MI: (d, digits) => d.toFixed(digits),
      MJ: x0 => x0.arrayBuffer(),
      MK: (x0,x1) => { x0.decoding = x1 },
      ML: (x0,x1) => x0.getItem(x1),
      MM: x0 => x0.width,
      MN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: x0 => x0.origin,
      NH: (x0,x1) => x0.item(x1),
      NI: (x0,x1) => { x0.spellcheck = x1 },
      NJ: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      NK: (x0,x1) => { x0.crossOrigin = x1 },
      NL: x0 => x0.localStorage,
      NM: (x0,x1) => { x0.src = x1 },
      NN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: x0 => x0.location,
      OH: x0 => x0.length,
      OI: (x0,x1) => { x0.disabled = x1 },
      OJ: (x0,x1) => x0.fetch(x1),
      OK: (x0,x1) => x0.createObjectURL(x1),
      OL: (x0,x1) => x0.key(x1),
      OM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ON: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: x0 => x0.flags,
      PG: () => globalThis.window,
      PH: () => globalThis.Sentry.close(),
      PI: (x0,x1) => { x0.autocomplete = x1 },
      PJ: x0 => x0.fontFallbackBaseUrl,
      PK: x0 => x0.URL,
      PL: x0 => x0.length,
      PM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: (o, p) => p in o,
      QH: (o, p, v) => o[p] = v,
      QI: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      QJ: (x0,x1,x2) => x0.slice(x1,x2),
      QK: x0 => new Blob(x0),
      QL: (x0,x1) => x0.removeItem(x1),
      QM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      QN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: x0 => x0.groups,
      RH: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      RI: (x0,x1) => { x0.value = x1 },
      RJ: (x0,x1) => x0.decode(x1),
      RK: x0 => x0.close(),
      RL: (x0,x1,x2) => x0.setItem(x1,x2),
      RM: (x0,x1) => { x0.onerror = x1 },
      RN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: x0 => x0.abort(),
      SH: x0 => globalThis.Sentry.init(x0),
      SI: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      SJ: (x0,x1) => x0.adoptText(x1),
      SK: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      SL: x0 => x0.baseURI,
      SM: (x0,x1) => { x0.oncancel = x1 },
      SN: (x0,x1,x2) => ({duration: x0,playbackRate: x1,position: x2}),
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: (a, i) => a.splice(i, 1),
      TH: () => new Sentry.getClient(),
      TI: (x0,x1) => x0.add(x1),
      TJ: x0 => x0.first(),
      TK: (x0,x1) => x0.decode(x1),
      TL: x0 => x0.document,
      TM: (x0,x1) => { x0.onchange = x1 },
      TN: (x0,x1) => x0.setPositionState(x1),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.left,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.blur(),
      UG: secondsSinceEpoch => {
        const date = new Date(secondsSinceEpoch * 1000);
        const match = /\((.*)\)/.exec(date.toString());
        if (match == null) {
            // This should never happen on any recent browser.
            return '';
        }
        return match[1];
      },
      UH: x0 => x0.getOptions(),
      UI: x0 => x0.data,
      UJ: x0 => x0.next(),
      UK: x0 => x0.displayHeight,
      UL: x0 => x0.load(),
      UM: x0 => x0.type,
      UN: x0 => x0.seekTime,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.clientY,
      VE: x0 => x0.language,
      VF: x0 => x0.button,
      VG: x0 => x0.devicePixelRatio,
      VH: (x0,x1) => { x0.name = x1 },
      VI: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      VJ: x0 => x0.current(),
      VK: x0 => x0.displayWidth,
      VL: (x0,x1) => x0.removeAttribute(x1),
      VM: x0 => x0.lastModified,
      VN: (x0,x1) => { x0.playbackState = x1 },
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientX,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.innerHeight,
      WG: x0 => x0.availWidth,
      WH: (x0,x1) => { x0.sdk = x1 },
      WI: x0 => x0.value,
      WJ: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      WK: x0 => x0.duration,
      WL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      WM: x0 => x0.name,
      WN: x0 => x0.length,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.changedTouches,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.innerWidth,
      XG: x0 => x0.availHeight,
      XH: x0 => x0.sdk,
      XI: x0 => x0.selectionDirection,
      XJ: x0 => x0.v8BreakIterator,
      XK: x0 => x0.image,
      XL: (x0,x1,x2) => x0.addEventListener(x1,x2),
      XM: (x0,x1) => x0.item(x1),
      XN: x0 => x0.getReader(),
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: x0 => x0.screen,
      YH: () => globalThis.Sentry.globalHandlersIntegration(),
      YI: x0 => x0.selectionStart,
      YJ: () => globalThis.Intl,
      YK: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      YL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YM: x0 => x0.length,
      YN: x0 => x0.value,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: x0 => x0.type,
      ZH: () => globalThis.Sentry.dedupeIntegration(),
      ZI: x0 => x0.selectionEnd,
      ZJ: (x0,x1) => x0.segment(x1),
      ZK: x0 => new window.ImageDecoder(x0),
      ZL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZM: x0 => x0.files,
      ZN: x0 => x0.done,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: x0 => x0.orientation,
      aH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aI: x0 => x0.selectionDirection,
      aJ: x0 => x0.index,
      aK: x0 => x0.name,
      aL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aM: x0 => x0.target,
      aN: x0 => x0.read(),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.maxTouchPoints,
      bE: (x0,x1) => x0.contains(x1),
      bF: x0 => x0.clientWidth,
      bG: x0 => x0.deviceMemory,
      bH: x0 => ({createScriptURL: x0}),
      bI: x0 => x0.selectionStart,
      bJ: x0 => x0.next(),
      bK: x0 => x0.repetitionCount,
      bL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      bM: (x0,x1) => x0.replaceChildren(x1),
      bN: x0 => x0.body,
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: x0 => x0.onLine,
      cH: (x0,x1,x2) => x0.createPolicy(x1,x2),
      cI: x0 => x0.selectionEnd,
      cJ: x0 => x0.value,
      cK: x0 => x0.frameCount,
      cL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cM: x0 => x0.click(),
      cN: (x0,x1) => new OffscreenCanvas(x0,x1),
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.body,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => { x0.name = x1 },
      dG: x0 => x0.navigator,
      dH: (x0,x1,x2) => x0.createScriptURL(x1,x2),
      dI: x0 => x0.keyCode,
      dJ: x0 => x0.done,
      dK: x0 => x0.selectedTrack,
      dL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      dM: (x0,x1,x2) => x0.setAttribute(x1,x2),
      dN: x0 => x0.assetBase,
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: x0 => x0.pathname,
      eH: x0 => x0.hasChildNodes(),
      eI: (x0,x1) => x0.scrollIntoView(x1),
      eJ: (o, m, a) => o[m].apply(o, a),
      eK: x0 => x0.completed,
      eL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eM: (x0,x1) => { x0.accept = x1 },
      eN: x0 => x0.loader,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.classList,
      fF: (x0,x1) => x0.removeChild(x1),
      fG: x0 => x0.userAgent,
      fH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      fI: x0 => x0.multiViewEnabled,
      fJ: x0 => x0.iterator,
      fK: x0 => x0.ready,
      fL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fM: (x0,x1) => { x0.multiple = x1 },
      fN: () => globalThis._flutter,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: (x0,x1) => x0.matchMedia(x1),
      gH: (x0,x1) => x0.append(x1),
      gI: (x0,x1) => x0.replaceWith(x1),
      gJ: () => globalThis.Symbol,
      gK: x0 => x0.tracks,
      gL: (x0,x1) => { x0.playbackRate = x1 },
      gM: (x0,x1) => { x0.type = x1 },
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: x0 => x0.matches,
      hH: x0 => x0.firstChild,
      hI: (x0,x1) => { x0.className = x1 },
      hJ: (x0,x1) => new Intl.Segmenter(x0,x1),
      hK: () => globalThis.window.ImageDecoder,
      hL: x0 => x0.currentTime,
      hM: (x0,x1) => x0.query(x1),
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: x0 => x0.platform,
      iH: x0 => x0.head,
      iI: (x0,x1) => { x0.name = x1 },
      iJ: x0 => x0.Segmenter,
      iK: (x0,x1) => { x0.value = x1 },
      iL: x0 => x0.message,
      iM: x0 => x0.state,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (map, o, v) => map.set(o, v),
      jH: (x0,x1) => { x0.integrity = x1 },
      jI: (x0,x1) => { x0.placeholder = x1 },
      jJ: () => new TextDecoder(),
      jK: x0 => x0.gain,
      jL: x0 => x0.code,
      jM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kH: (x0,x1) => { x0.src = x1 },
      kI: (x0,x1) => { x0.name = x1 },
      kJ: a => a.pop(),
      kK: x0 => x0.resume(),
      kL: x0 => x0.error,
      kM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.ctrlKey,
      lF: (handle) => clearInterval(handle),
      lG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      lH: x0 => x0.trustedTypes,
      lI: (x0,x1) => { x0.placeholder = x1 },
      lJ: x0 => x0.click(),
      lK: x0 => x0.createBufferSource(),
      lL: x0 => x0.duration,
      lM: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.y,
      mF: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      mG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      mH: (x0,x1) => { x0.crossOrigin = x1 },
      mI: (x0,x1) => { x0.action = x1 },
      mJ: (x0,x1) => x0.getElementsByClassName(x1),
      mK: (x0,x1) => x0.connect(x1),
      mL: (x0,x1) => { x0.currentTime = x1 },
      mM: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.x,
      nF: () => Date.now(),
      nG: x0 => x0.hash,
      nH: (x0,x1) => x0.createElement(x1),
      nI: (x0,x1) => { x0.method = x1 },
      nJ: (x0,x1) => x0.dispatchEvent(x1),
      nK: x0 => x0.start(),
      nL: (x0,x1) => { x0.preload = x1 },
      nM: x0 => x0.message,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: (x0,x1) => x0.getRandomValues(x1),
      oG: x0 => x0.location,
      oH: (x0,x1) => x0.requestAnimationFrame(x1),
      oI: (x0,x1) => { x0.noValidate = x1 },
      oJ: (x0,x1) => x0.createEvent(x1),
      oK: (x0,x1) => { x0.loop = x1 },
      oL: (x0,x1) => { x0.src = x1 },
      oM: x0 => x0.code,
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: () => globalThis.crypto,
      pG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pI: (x0,x1) => x0.transferFromImageBitmap(x1),
      pJ: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      pK: (x0,x1) => { x0.buffer = x1 },
      pL: x0 => x0.src,
      pM: x0 => x0.speed,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: l => new DataView(new ArrayBuffer(l)),
      qG: x0 => x0.history,
      qH: x0 => x0.now(),
      qI: (x0,x1) => x0.getContext(x1),
      qJ: x0 => x0.readText(),
      qK: x0 => x0.state,
      qL: x0 => x0.play(),
      qM: x0 => x0.heading,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: () => new WeakMap(),
      rG: x0 => x0.search,
      rH: x0 => x0.performance,
      rI: (x0,x1) => { x0.height = x1 },
      rJ: x0 => x0.clipboard,
      rK: (x0,x1) => x0.fetch(x1),
      rL: (x0,x1) => x0.end(x1),
      rM: x0 => x0.accuracy,
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: (map, o) => map.get(o),
      sG: x0 => x0.pathname,
      sH: (x0,x1) => x0.removeProperty(x1),
      sI: (x0,x1) => { x0.width = x1 },
      sJ: (x0,x1) => x0.writeText(x1),
      sK: x0 => x0.arrayBuffer(),
      sL: x0 => x0.length,
      sM: x0 => x0.altitudeAccuracy,
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      tG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      tH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      tI: x0 => x0.height,
      tJ: x0 => x0.unlock(),
      tK: (x0,x1) => x0.decodeAudioData(x1),
      tL: x0 => x0.buffered,
      tM: x0 => x0.altitude,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      uG: o => Object.keys(o),
      uH: x0 => x0.parentElement,
      uI: x0 => x0.width,
      uJ: (x0,x1) => x0.lock(x1),
      uK: x0 => x0.ok,
      uL: x0 => x0.pause(),
      uM: x0 => x0.timestamp,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: () => new AbortController(),
      vG: x0 => x0.state,
      vH: (x0,x1) => x0.removeAttribute(x1),
      vI: x0 => x0.rasterEndMilliseconds,
      vJ: x0 => x0.orientation,
      vK: () => new AudioContext(),
      vL: (x0,x1) => x0.setSinkId(x1),
      vM: x0 => x0.longitude,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      wG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      wH: x0 => x0.id,
      wI: x0 => x0.rasterStartMilliseconds,
      wJ: (x0,x1) => x0.querySelector(x1),
      wK: x0 => x0.createGain(),
      wL: (x0,x1) => { x0.volume = x1 },
      wM: x0 => x0.latitude,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: (x0,x1) => globalThis.fetch(x0,x1),
      xG: (x0,x1) => x0.go(x1),
      xH: (x0,x1) => x0.querySelectorAll(x1),
      xI: x0 => x0.imageBitmaps,
      xJ: (x0,x1) => { x0.title = x1 },
      xK: x0 => x0.destination,
      xL: (x0,x1) => x0.querySelector(x1),
      xM: x0 => x0.coords,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: (x0,x1) => x0.get(x1),
      yG: x0 => x0.state,
      yH: x0 => x0.isConnected,
      yI: x0 => x0.canvasKitMaximumSurfaces,
      yJ: (x0,x1) => x0.vibrate(x1),
      yK: x0 => x0.stop(),
      yL: (x0,x1) => { x0.id = x1 },
      yM: x0 => x0.permissions,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      zG: (x0,x1) => x0.sendEnvelope(x1),
      zH: x0 => x0.offsetHeight,
      zI: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      zJ: x0 => x0.content,
      zK: x0 => x0.disconnect(),
      zL: x0 => globalThis.URL.revokeObjectURL(x0),
      zM: x0 => x0.geolocation,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
