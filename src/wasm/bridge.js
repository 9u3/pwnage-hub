// WASM bridge - extracted from Pwnage Drivers Hub hub-3.4.4.min.js
// This provides the wasm-bindgen glue for the stormbreaker_1 Rust WASM module.

let Q; // WASM exports
let n_ = null; // Int32Array view
let r_ = null; // Uint32Array view
let t_ = null; // Uint8Array view
let sr = 0;

// Heap / slab for passing JS objects to WASM
const heap = new Array(128).fill(void 0);
heap.push(void 0, null, true, false);

function getObject(idx) { return heap[idx]; }

let heapNext = heap.length;

function dropObject(idx) {
  if (idx < 132) return;
  heap[idx] = heapNext;
  heapNext = idx;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

function addHeapObject(obj) {
  if (heapNext === heap.length) heap.push(heap.length + 1);
  const idx = heapNext;
  heapNext = heap[idx];
  heap[idx] = obj;
  return idx;
}

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();

const cachedTextEncoder = new TextEncoder('utf-8');

function getUint8Memory() {
  if (t_ === null || t_.byteLength === 0) {
    t_ = new Uint8Array(Q.memory.buffer);
  }
  return t_;
}

function getInt32Memory() {
  if (n_ === null || n_.byteLength === 0) {
    n_ = new Int32Array(Q.memory.buffer);
  }
  return n_;
}

function getUint32Memory() {
  if (r_ === null || r_.byteLength === 0) {
    r_ = new Uint32Array(Q.memory.buffer);
  }
  return r_;
}

function getStringFromWasm(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

function passArrayToWasm(arr, alloc) {
  const ptr = alloc(arr.length * 1, 1) >>> 0;
  getUint8Memory().set(arr, ptr / 1);
  sr = arr.length;
  return ptr;
}

function getArrayU8FromWasm(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8Memory().subarray(ptr / 1, ptr / 1 + len);
}

function getInt32ArrayFromWasm(ptr, len) {
  ptr = ptr >>> 0;
  return getInt32Memory().subarray(ptr / 4, ptr / 4 + len);
}

function passInt32ArrayToWasm(arr, alloc) {
  const ptr = alloc(arr.length * 4, 4) >>> 0;
  getUint32Memory().set(arr, ptr / 4);
  sr = arr.length;
  return ptr;
}

function passArray32ToWasm(arr, alloc) {
  const ptr = alloc(arr.length * 4, 4) >>> 0;
  getUint32Memory().set(arr, ptr / 4);
  sr = arr.length;
  return ptr;
}

function passStringToWasm(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8Memory().subarray(ptr, ptr + buf.length).set(buf);
    sr = buf.length;
    return ptr;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8Memory();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) arg = arg.slice(offset);
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8Memory().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  sr = offset;
  return ptr;
}

function debugString(val) {
  const type = typeof val;
  if (type === 'number' || type === 'boolean' || val == null) return `${val}`;
  if (type === 'string') return `"${val}"`;
  if (type === 'symbol') return val.description == null ? 'Symbol' : `Symbol(${val.description})`;
  if (type === 'function') {
    const name = val.name;
    return typeof name === 'string' && name.length > 0 ? `Function(${name})` : 'Function';
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = '[';
    if (length > 0) debug += debugString(val[0]);
    for (let i = 1; i < length; i++) debug += ', ' + debugString(val[i]);
    debug += ']';
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) className = builtInMatches[1];
  else return toString.call(val);
  if (className === 'Object') {
    try {
      return 'Object(' + JSON.stringify(val) + ')';
    } catch (_) {
      return 'Object';
    }
  }
  if (val instanceof Error) return `${val.name}: ${val.message}\n${val.stack}`;
  return className;
}

function getImports() {
  const imports = {};
  imports.wbg = {};

  imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
  };
  imports.wbg.__wbg_log_a10957e7d084567c = function(arg0, arg1) {
    console.log(getStringFromWasm(arg0, arg1));
  };
  imports.wbg.__wbindgen_number_new = function(arg0) {
    return addHeapObject(arg0);
  };
  imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
    const val = getObject(arg0);
    return addHeapObject(val);
  };
  imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_841ac57cff3d672b = function(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
  };
  imports.wbg.__wbg_new_16b304a2cfa7ff4a = function() {
    return addHeapObject(new Array());
  };
  imports.wbg.__wbg_new_72fb9a18b5ae2624 = function() {
    return addHeapObject(new Object());
  };
  imports.wbg.__wbg_set_d4638f722068f043 = function(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
  };
  imports.wbg.__wbg_push_a5b05aedc7234f9f = function(arg0, arg1) {
    return getObject(arg0).push(getObject(arg1));
  };
  imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
    return addHeapObject(new Error());
  };
  imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr = passStringToWasm(ret, Q.__wbindgen_malloc, Q.__wbindgen_realloc);
    const len = sr;
    getInt32Memory()[arg0 / 4 + 1] = len;
    getInt32Memory()[arg0 / 4 + 0] = ptr;
  };
  imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
    let a, b;
    try {
      a = arg0; b = arg1;
      console.error(getStringFromWasm(arg0, arg1));
    } finally {
      Q.__wbindgen_free(a, b, 1);
    }
  };
  imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr = passStringToWasm(ret, Q.__wbindgen_malloc, Q.__wbindgen_realloc);
    const len = sr;
    getInt32Memory()[arg0 / 4 + 1] = len;
    getInt32Memory()[arg0 / 4 + 0] = ptr;
  };
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm(arg0, arg1));
  };

  return imports;
}

function finalizeInit(instance, module) {
  Q = instance.exports;
  initWasm.__wbindgen_wasm_module = module;
  n_ = null;
  r_ = null;
  t_ = null;
  return Q;
}

export async function initWasm(input) {
  if (Q !== undefined) return Q;

  const imports = getImports();

  if (typeof input === 'string' || input instanceof URL) {
    input = fetch(input);
  }

  const { instance, module } = await (async () => {
    if (input instanceof Response || (typeof input === 'object' && input.then)) {
      const response = await input;
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          return await WebAssembly.instantiateStreaming(response, imports);
        } catch (e) {
          if (response.headers.get('Content-Type') !== 'application/wasm') {
            console.warn('instantiateStreaming failed, falling back');
          } else {
            throw e;
          }
        }
      }
      const bytes = await response.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    } else {
      return await WebAssembly.instantiate(input, imports);
    }
  })();

  return finalizeInit(instance, module);
}

// Receive/parse data from device
export function receiveData(data) {
  const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
  const len = sr;
  const ret = Q.receieve_data(ptr, len);
  return takeObject(ret);
}

// StormBreaker class - wraps the WASM stormbreaker_1 module
// Used by Trinity, StormBreaker V2/V3, StormBreaker Max CF
export class StormBreaker {
  static getFirmwareVersion() {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_firmware_version(retptr);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getDpiInfo(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_info(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setDpiInfo(profileIndex, dpiX, dpiY) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_device_dpi_info(retptr, profileIndex, dpiX, dpiY);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiInfo(data) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_parse_device_dpi_info(retptr, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getInt32ArrayFromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 4, 4);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getDpiStagesInfo(profileIndex, maxStages) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_stages_info(retptr, profileIndex, maxStages);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiStagesInfo(data) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_parse_device_dpi_stages_info(retptr, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getInt32ArrayFromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 4, 4);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setDpiStagesInfo(profileIndex, numStages, dpiArray) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passInt32ArrayToWasm(dpiArray, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_set_device_dpi_stages_info(retptr, profileIndex, numStages, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getDpiActiveStageInfo(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_active_stage_info(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiActiveStageInfo(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_dpi_active_stage_info(ptr, len);
  }

  static getDpiStageColor(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_stage_color(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiStageColor(data) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_parse_device_dpi_stage_color(retptr, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getInt32ArrayFromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 4, 4);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getPollingInfo(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_polling_info(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setPollingInfo(profileIndex, pollingRate) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_device_polling_info(retptr, profileIndex, pollingRate);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parsePollingInfo(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_polling_info(ptr, len);
  }

  static getDebounceTime(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_debounce_time(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setDebounceTime(profileIndex, debounceTime) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_device_debounce_time(retptr, profileIndex, debounceTime);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDebounceTime(data) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_parse_device_debounce_time(retptr, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getInt32ArrayFromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 4, 4);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getLodSetting(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_lod_setting(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setLodSetting(profileIndex, lod) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_lod_setting(retptr, profileIndex, lod);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseLodSetting(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_lod_setting(ptr, len);
  }

  static getAngleSnap(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_angle_snap(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setAngleSnap(profileIndex, enabled) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_angle_snap(retptr, profileIndex, enabled);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseAngleSnap(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_angle_snap(ptr, len);
  }

  static getMotionSync(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_motion_sync_setting(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setMotionSync(profileIndex, enabled) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_motion_sync_setting(retptr, profileIndex, enabled);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseMotionSync(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_motion_sync_setting(ptr, len);
  }

  static getSleepTime(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_sleep_time(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static setSleepTime(profileIndex, seconds) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_device_sleep_time(retptr, profileIndex, seconds);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseSleepTime(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_sleep_time(ptr, len);
  }

  static getProfileInfo(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_profile_info(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseProfileInfo(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_profile_info(ptr, len);
  }

  static getBatteryInfo(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_set_device_battery_info(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseBatteryInfo(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_battery_info(ptr, len);
  }

  static getButtonMapping(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_button_mapping(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static getDpiMaxRange() {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_max_range(retptr);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiMaxRange(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_dpi_max_range(ptr, len);
  }

  static getSensorModel() {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_sensor_model(retptr);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseSensorModel(data) {
    let t, r;
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
      const len = sr;
      Q.stormbreaker_1_parse_sensor_model(retptr, ptr, len);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      t = r0;
      r = r1;
      return getStringFromWasm(r0, r1);
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
      Q.__wbindgen_free(t, r, 1);
    }
  }

  static getDpiIndicatorEnable(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_device_dpi_indicator_enable(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseDpiIndicatorEnable(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_device_dpi_indicator_enable(ptr, len);
  }

  static handleNotification(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    const ret = Q.stormbreaker_1_handle_notification(ptr, len);
    return takeObject(ret);
  }

  static getRippleControl(profileIndex) {
    try {
      const retptr = Q.__wbindgen_add_to_stack_pointer(-16);
      Q.stormbreaker_1_get_ripple_control(retptr, profileIndex);
      const r0 = getInt32Memory()[retptr / 4 + 0];
      const r1 = getInt32Memory()[retptr / 4 + 1];
      const result = getArrayU8FromWasm(r0, r1).slice();
      Q.__wbindgen_free(r0, r1 * 1, 1);
      return result;
    } finally {
      Q.__wbindgen_add_to_stack_pointer(16);
    }
  }

  static parseRippleControl(data) {
    const ptr = passArrayToWasm(data, Q.__wbindgen_malloc);
    const len = sr;
    return Q.stormbreaker_1_parse_ripple_control(ptr, len);
  }
}
