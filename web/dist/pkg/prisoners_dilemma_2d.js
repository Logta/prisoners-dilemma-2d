let wasm;

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * 標準的なシミュレーション設定を作成
 * @returns {WasmSimulationConfig}
 */
export function create_standard_config() {
    const ret = wasm.create_standard_config();
    return WasmSimulationConfig.__wrap(ret);
}

/**
 * パニックフックを設定
 */
export function main() {
    wasm.main();
}

const WasmBattleManagerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbattlemanager_free(ptr >>> 0, 1));
/**
 * WebAssembly用の戦闘マネージャー
 */
export class WasmBattleManager {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBattleManager.prototype);
        obj.__wbg_ptr = ptr;
        WasmBattleManagerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBattleManagerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbattlemanager_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmbattlemanager_new();
        this.__wbg_ptr = ret >>> 0;
        WasmBattleManagerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * カスタム利得マトリクスで戦闘マネージャーを作成
     * @param {number} mutual_cooperation
     * @param {number} mutual_defection
     * @param {number} cooperation_exploited
     * @param {number} defection_advantage
     * @returns {WasmBattleManager}
     */
    static with_payoff_matrix(mutual_cooperation, mutual_defection, cooperation_exploited, defection_advantage) {
        const ret = wasm.wasmbattlemanager_with_payoff_matrix(mutual_cooperation, mutual_defection, cooperation_exploited, defection_advantage);
        return WasmBattleManager.__wrap(ret);
    }
    /**
     * 戦闘を実行
     * @param {bigint} agent1_id
     * @param {bigint} agent2_id
     * @param {string} agents_json
     * @returns {any}
     */
    execute_battle(agent1_id, agent2_id, agents_json) {
        const ptr0 = passStringToWasm0(agents_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbattlemanager_execute_battle(this.__wbg_ptr, agent1_id, agent2_id, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 戦闘履歴を取得
     * @param {bigint} agent_id
     * @param {bigint | null} [opponent_id]
     * @param {number | null} [limit]
     * @returns {any}
     */
    get_battle_history(agent_id, opponent_id, limit) {
        const ret = wasm.wasmbattlemanager_get_battle_history(this.__wbg_ptr, agent_id, !isLikeNone(opponent_id), isLikeNone(opponent_id) ? BigInt(0) : opponent_id, isLikeNone(limit) ? 0x100000001 : (limit) >>> 0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 現在のラウンドを取得
     * @returns {number}
     */
    current_round() {
        const ret = wasm.wasmbattlemanager_current_round(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * ラウンドを進める
     */
    advance_round() {
        wasm.wasmbattlemanager_advance_round(this.__wbg_ptr);
    }
    /**
     * 履歴をクリア
     */
    clear_history() {
        wasm.wasmbattlemanager_clear_history(this.__wbg_ptr);
    }
}

const WasmSimulationConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsimulationconfig_free(ptr >>> 0, 1));
/**
 * WebAssembly用のシミュレーション設定
 */
export class WasmSimulationConfig {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmSimulationConfig.prototype);
        obj.__wbg_ptr = ptr;
        WasmSimulationConfigFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSimulationConfigFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsimulationconfig_free(ptr, 0);
    }
    /**
     * @param {number} world_width
     * @param {number} world_height
     * @param {number} initial_population
     * @param {number} max_generations
     * @param {number} battles_per_generation
     * @param {number} neighbor_radius
     * @param {number} mutation_rate
     * @param {number} mutation_strength
     * @param {number} elite_ratio
     * @param {string} selection_method
     * @param {string} crossover_method
     */
    constructor(world_width, world_height, initial_population, max_generations, battles_per_generation, neighbor_radius, mutation_rate, mutation_strength, elite_ratio, selection_method, crossover_method) {
        const ptr0 = passStringToWasm0(selection_method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(crossover_method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmsimulationconfig_new(world_width, world_height, initial_population, max_generations, battles_per_generation, neighbor_radius, mutation_rate, mutation_strength, elite_ratio, ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        WasmSimulationConfigFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    get world_width() {
        const ret = wasm.wasmsimulationconfig_world_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get world_height() {
        const ret = wasm.wasmsimulationconfig_world_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get initial_population() {
        const ret = wasm.wasmbattlemanager_current_round(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get max_generations() {
        const ret = wasm.wasmsimulationconfig_max_generations(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get battles_per_generation() {
        const ret = wasm.wasmsimulationconfig_battles_per_generation(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get neighbor_radius() {
        const ret = wasm.wasmsimulationconfig_neighbor_radius(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get mutation_rate() {
        const ret = wasm.wasmsimulationconfig_mutation_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get mutation_strength() {
        const ret = wasm.wasmsimulationconfig_mutation_strength(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get elite_ratio() {
        const ret = wasm.wasmsimulationconfig_elite_ratio(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get selection_method() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmsimulationconfig_selection_method(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get crossover_method() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmsimulationconfig_crossover_method(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} method
     */
    set selection_method(method) {
        const ptr0 = passStringToWasm0(method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wasmsimulationconfig_set_selection_method(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} method
     */
    set crossover_method(method) {
        const ptr0 = passStringToWasm0(method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wasmsimulationconfig_set_crossover_method(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmSimulationManagerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsimulationmanager_free(ptr >>> 0, 1));
/**
 * WebAssembly用のシミュレーションマネージャー
 */
export class WasmSimulationManager {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSimulationManagerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsimulationmanager_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmsimulationmanager_new();
        this.__wbg_ptr = ret >>> 0;
        WasmSimulationManagerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * シミュレーションを初期化
     * @param {WasmSimulationConfig} config
     * @returns {any}
     */
    initialize(config) {
        _assertClass(config, WasmSimulationConfig);
        const ret = wasm.wasmsimulationmanager_initialize(this.__wbg_ptr, config.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 指定世代数のシミュレーションを実行
     * @param {WasmSimulationConfig} config
     * @param {number} generations
     * @returns {any}
     */
    run_simulation(config, generations) {
        _assertClass(config, WasmSimulationConfig);
        const ret = wasm.wasmsimulationmanager_run_simulation(this.__wbg_ptr, config.__wbg_ptr, generations);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 1ステップ実行
     * @returns {any}
     */
    step() {
        const ret = wasm.wasmsimulationmanager_step(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 1世代実行
     * @returns {any}
     */
    run_generation() {
        const ret = wasm.wasmsimulationmanager_run_generation(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 現在の統計を取得
     * @returns {any}
     */
    get_current_stats() {
        const ret = wasm.wasmsimulationmanager_get_current_stats(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 現在のエージェント情報を取得
     * @returns {any}
     */
    get_current_agents() {
        const ret = wasm.wasmsimulationmanager_get_current_agents(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 指定位置のエージェントを取得
     * @param {number} x
     * @param {number} y
     * @returns {any}
     */
    get_agent_at(x, y) {
        const ret = wasm.wasmsimulationmanager_get_agent_at(this.__wbg_ptr, x, y);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * シミュレーションが完了しているかチェック
     * @returns {boolean}
     */
    is_finished() {
        const ret = wasm.wasmsimulationmanager_is_finished(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * シミュレーションをリセット
     */
    reset() {
        wasm.wasmsimulationmanager_reset(this.__wbg_ptr);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = arg0.process;
        return ret;
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('prisoners_dilemma_2d_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
