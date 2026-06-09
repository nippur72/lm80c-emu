//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region src/audio.ts
var LMAudio = class {
	constructor(bufsize) {
		this.AUDIO_BUFSIZE = bufsize;
		this.playing = false;
		this.buffers = [];
		this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		this.sampleRate = this.audioContext.sampleRate;
		this.speakerSound = this.audioContext.createScriptProcessor(this.AUDIO_BUFSIZE, 1, 1);
		this.speakerSound.onaudioprocess = (e) => {
			const output = e.outputBuffer.getChannelData(0);
			if (this.buffers.length === 0) return;
			else if (this.buffers.length > 2) {
				this.buffers = [];
				return;
			}
			const buffer = this.buffers[0];
			this.buffers = this.buffers.slice(1);
			for (let i = 0; i < this.AUDIO_BUFSIZE; i++) output[i] = buffer[i];
		};
	}
	playBuffer(buffer) {
		if (!this.playing) return;
		this.buffers.push([...buffer]);
	}
	start() {
		this.speakerSound.connect(this.audioContext.destination);
		this.playing = true;
		this.buffers = [];
	}
	stop() {
		this.speakerSound.disconnect(this.audioContext.destination);
		this.playing = false;
	}
	resume() {
		if (this.audioContext.state === "suspended") this.audioContext.resume().then(() => {
			this.buffers = [];
		});
	}
};
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
//#endregion
//#region node_modules/idb-keyval/dist/idb-keyval.mjs
var import_FileSaver = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var saveAs = saveAs || function(view) {
		"use strict";
		if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) return;
		var doc = view.document, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = "download" in save_link, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}, is_safari = /constructor/i.test(view.HTMLElement) || view.safari, is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent), throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}, force_saveable_type = "application/octet-stream", arbitrary_revoke_timeout = 1e3 * 40, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") get_URL().revokeObjectURL(file);
				else file.remove();
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") try {
					listener.call(filesaver, event || filesaver);
				} catch (ex) {
					throw_outside(ex);
				}
			}
		}, auto_bom = function(blob) {
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
			return blob;
		}, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) blob = auto_bom(blob);
			var filesaver = this, force = blob.type === force_saveable_type, object_url, dispatch_all = function() {
				dispatch(filesaver, "writestart progress write writeend".split(" "));
			}, fs_error = function() {
				if ((is_chrome_ios || force && is_safari) && view.FileReader) {
					var reader = new FileReader();
					reader.onloadend = function() {
						var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, "data:attachment/file;");
						if (!view.open(url, "_blank")) view.location.href = url;
						url = void 0;
						filesaver.readyState = filesaver.DONE;
						dispatch_all();
					};
					reader.readAsDataURL(blob);
					filesaver.readyState = filesaver.INIT;
					return;
				}
				if (!object_url) object_url = get_URL().createObjectURL(blob);
				if (force) view.location.href = object_url;
				else if (!view.open(object_url, "_blank")) view.location.href = object_url;
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
			};
			filesaver.readyState = filesaver.INIT;
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}
			fs_error();
		}, FS_proto = FileSaver.prototype, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		};
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";
			if (!no_auto_bom) blob = auto_bom(blob);
			return navigator.msSaveOrOpenBlob(blob, name);
		};
		FS_proto.abort = function() {};
		FS_proto.readyState = FS_proto.INIT = 0;
		FS_proto.WRITING = 1;
		FS_proto.DONE = 2;
		FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
		return saveAs;
	}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || exports.content);
	if (typeof module !== "undefined" && module.exports) module.exports.saveAs = saveAs;
	else if (typeof define !== "undefined" && define !== null && define.amd !== null) define("FileSaver.js", function() {
		return saveAs;
	});
})))();
var Store = class {
	constructor(dbName = "keyval-store", storeName = "keyval") {
		this.storeName = storeName;
		this._dbp = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(dbName, 1);
			openreq.onerror = () => reject(openreq.error);
			openreq.onsuccess = () => resolve(openreq.result);
			openreq.onupgradeneeded = () => {
				openreq.result.createObjectStore(storeName);
			};
		});
	}
	_withIDBStore(type, callback) {
		return this._dbp.then((db) => new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, type);
			transaction.oncomplete = () => resolve();
			transaction.onabort = transaction.onerror = () => reject(transaction.error);
			callback(transaction.objectStore(this.storeName));
		}));
	}
};
var store;
function getDefaultStore() {
	if (!store) store = new Store();
	return store;
}
function get(key, store = getDefaultStore()) {
	let req;
	return store._withIDBStore("readonly", (store) => {
		req = store.get(key);
	}).then(() => req.result);
}
function set(key, value, store = getDefaultStore()) {
	return store._withIDBStore("readwrite", (store) => {
		store.put(value, key);
	});
}
function del(key, store = getDefaultStore()) {
	return store._withIDBStore("readwrite", (store) => {
		store.delete(key);
	});
}
function keys(store = getDefaultStore()) {
	const keys = [];
	return store._withIDBStore("readonly", (store) => {
		(store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
			if (!this.result) return;
			keys.push(this.result.key);
			this.result.continue();
		};
	}).then(() => keys);
}
//#endregion
//#region src/filesystem.ts
var BrowserStorage = class {
	constructor(key) {
		this.STORAGE_KEY = key;
		this.store = new Store(this.STORAGE_KEY, this.STORAGE_KEY);
		window.dir = () => this.dir();
		window.remove = (fn) => this.remove(fn);
		window.download = (fn) => this.download(fn);
		window.upload = (fn) => this.upload(fn);
	}
	async readFile(fileName) {
		return await get(fileName, this.store);
	}
	async writeFile(fileName, bytes) {
		await set(fileName, bytes, this.store);
	}
	async removeFile(fileName) {
		await del(fileName, this.store);
	}
	async fileExists(fileName) {
		return await get(fileName, this.store) !== void 0;
	}
	async dir() {
		(await keys(this.store)).forEach(async (fn) => {
			const length = (await this.readFile(fn)).length;
			console.log(`${fn} (${length} bytes)`);
		});
	}
	async remove(filename) {
		if (await this.fileExists(filename)) {
			await this.removeFile(filename);
			console.log(`removed "${filename}"`);
		} else console.log(`file "${filename}" not found`);
	}
	async download(fileName) {
		if (!await this.fileExists(fileName)) {
			console.log(`file "${fileName}" not found`);
			return;
		}
		const bytes = await this.readFile(fileName);
		(0, import_FileSaver.saveAs)(new Blob([bytes], { type: "application/octet-stream" }), fileName);
		console.log(`downloaded "${fileName}"`);
	}
	async upload(fileName) {
		throw "not impemented";
	}
};
//#endregion
//#region src/bbs.ts
var BBS = class {
	constructor() {
		this.connected = false;
		this.ws_connection = void 0;
		this.onreceive = void 0;
		this.debug = false;
	}
	async connect(url, protocol) {
		return new Promise((resolve, reject) => {
			if (url === void 0) url = "wss://bbs.sblendorio.eu:8080";
			if (protocol === void 0) protocol = "bbs";
			if (this.connected) {
				if (this.debug) console.log("BBS: already connected");
				reject("already connected");
			}
			this.ws_connection = new WebSocket(url, protocol);
			this.ws_connection.onerror = (err) => this.onerror(err);
			this.ws_connection.onclose = () => this.onclose();
			this.ws_connection.onmessage = (e) => this.onmessage(e);
			this.ws_connection.onopen = () => {
				this.connected = true;
				if (this.debug) console.log("websocket: connected");
				resolve("connected");
			};
		});
	}
	onerror(err) {
		if (this.debug) console.log("websocket: connection error");
		this.connected = false;
	}
	onclose() {
		if (this.debug) console.log("websocket: disconnected");
		this.connected = false;
	}
	async onmessage(e) {
		if (!this.connected) return;
		if (typeof e.data === "string") {
			if (this.debug) console.log("Received string: '" + e.data + "'");
		} else {
			let data = await e.data.arrayBuffer();
			let bytes = new Uint8Array(data);
			if (this.onreceive !== void 0) this.onreceive(bytes);
			if (this.debug) console.log(`websocket: received ${bytes.length} bytes`, this.array2String(bytes));
		}
	}
	send(data) {
		if (!this.connected) {
			if (this.debug) console.log("websocket: can't send because not connected");
			return;
		}
		let bytes = new Uint8Array(data);
		if (this.ws_connection.readyState === this.ws_connection.OPEN) {
			this.ws_connection.send(bytes);
			if (this.debug) console.log(`websocket: sent ${bytes.length} bytes`, this.array2String(bytes));
		} else if (this.debug) console.log("websocket: can't send because disconnected");
	}
	sendText(text) {
		this.send(this.string2Array(text));
	}
	disconnect() {
		this.ws_connection.close();
	}
	string2Array(str) {
		let arr = [];
		for (let t = 0; t < str.length; t++) arr.push(str.charCodeAt(t) & 255);
		return new Uint8Array(arr);
	}
	array2String(data) {
		let str = "";
		for (var index = 0; index < data.length; index++) str += String.fromCharCode(data[index]);
		return str;
	}
};
//#endregion
//#region src/emscripten_wrapper.ts
var wasm_instance;
var psg_init;
var psg_reset;
var ctc_init;
var ctc_reset;
var get_z80_a;
var get_z80_f;
var get_z80_l;
var get_z80_h;
var get_z80_e;
var get_z80_d;
var get_z80_c;
var get_z80_b;
var get_z80_sp;
var get_z80_iy;
var get_z80_ix;
var get_z80_pc;
var set_z80_a;
var set_z80_f;
var set_z80_l;
var set_z80_h;
var set_z80_e;
var set_z80_d;
var set_z80_c;
var set_z80_b;
var set_z80_sp;
var set_z80_iy;
var set_z80_ix;
var set_z80_pc;
var cpu_init;
var cpu_reset;
var mem_read;
var mem_write;
var rom_load;
var lm80c_init;
var lm80c_reset;
var lm80c_ticks;
var keyboard_reset;
var keyboard_press;
var SIO_receiveChar;
async function load_wasm() {
	const emscripten_module = (await import("./emscripten_module-_mwPEk15.mjs")).default;
	const instance = await emscripten_module({ locateFile: (path) => {
		if (path.endsWith(".wasm")) return "./emscripten_module.wasm";
		return path;
	} });
	instance.cwrap("test_function");
	psg_init = instance.cwrap("psg_init");
	psg_reset = instance.cwrap("psg_reset");
	instance.cwrap("psg_ticks", "void", ["number"]);
	instance.cwrap("psg_read", "number", ["number"]);
	instance.cwrap("psg_write", null, ["number", "number"]);
	ctc_init = instance.cwrap("ctc_init");
	ctc_reset = instance.cwrap("ctc_reset");
	instance.cwrap("ctc_ticks", "number", ["number"]);
	instance.cwrap("ctc_read", "number", ["number"]);
	instance.cwrap("ctc_write", null, ["number", "number"]);
	instance.cwrap("ctc_set_reti");
	get_z80_a = instance.cwrap("get_z80_a", "number");
	get_z80_f = instance.cwrap("get_z80_f", "number");
	get_z80_l = instance.cwrap("get_z80_l", "number");
	get_z80_h = instance.cwrap("get_z80_h", "number");
	get_z80_e = instance.cwrap("get_z80_e", "number");
	get_z80_d = instance.cwrap("get_z80_d", "number");
	get_z80_c = instance.cwrap("get_z80_c", "number");
	get_z80_b = instance.cwrap("get_z80_b", "number");
	instance.cwrap("get_z80_fa", "number");
	instance.cwrap("get_z80_af", "number");
	instance.cwrap("get_z80_hl", "number");
	instance.cwrap("get_z80_de", "number");
	instance.cwrap("get_z80_bc", "number");
	instance.cwrap("get_z80_fa_", "number");
	instance.cwrap("get_z80_af_", "number");
	instance.cwrap("get_z80_hl_", "number");
	instance.cwrap("get_z80_de_", "number");
	instance.cwrap("get_z80_bc_", "number");
	get_z80_sp = instance.cwrap("get_z80_sp", "number");
	get_z80_iy = instance.cwrap("get_z80_iy", "number");
	get_z80_ix = instance.cwrap("get_z80_ix", "number");
	instance.cwrap("get_z80_wz", "number");
	get_z80_pc = instance.cwrap("get_z80_pc", "number");
	instance.cwrap("get_z80_ir", "number");
	instance.cwrap("get_z80_i", "number");
	instance.cwrap("get_z80_r", "number");
	instance.cwrap("get_z80_im", "number");
	instance.cwrap("get_z80_iff1", "number");
	instance.cwrap("get_z80_iff2", "number");
	instance.cwrap("get_z80_ei_pending", "number");
	set_z80_a = instance.cwrap("set_z80_a", null, ["number"]);
	set_z80_f = instance.cwrap("set_z80_f", null, ["number"]);
	set_z80_l = instance.cwrap("set_z80_l", null, ["number"]);
	set_z80_h = instance.cwrap("set_z80_h", null, ["number"]);
	set_z80_e = instance.cwrap("set_z80_e", null, ["number"]);
	set_z80_d = instance.cwrap("set_z80_d", null, ["number"]);
	set_z80_c = instance.cwrap("set_z80_c", null, ["number"]);
	set_z80_b = instance.cwrap("set_z80_b", null, ["number"]);
	instance.cwrap("set_z80_af", null, ["number"]);
	instance.cwrap("set_z80_fa", null, ["number"]);
	instance.cwrap("set_z80_hl", null, ["number"]);
	instance.cwrap("set_z80_de", null, ["number"]);
	instance.cwrap("set_z80_bc", null, ["number"]);
	instance.cwrap("set_z80_fa_", null, ["number"]);
	instance.cwrap("set_z80_af_", null, ["number"]);
	instance.cwrap("set_z80_hl_", null, ["number"]);
	instance.cwrap("set_z80_de_", null, ["number"]);
	instance.cwrap("set_z80_bc_", null, ["number"]);
	set_z80_sp = instance.cwrap("set_z80_sp", null, ["number"]);
	set_z80_iy = instance.cwrap("set_z80_iy", null, ["number"]);
	set_z80_ix = instance.cwrap("set_z80_ix", null, ["number"]);
	instance.cwrap("set_z80_wz", null, ["number"]);
	set_z80_pc = instance.cwrap("set_z80_pc", null, ["number"]);
	instance.cwrap("set_z80_ir", null, ["number"]);
	instance.cwrap("set_z80_i", null, ["number"]);
	instance.cwrap("set_z80_r", null, ["number"]);
	instance.cwrap("set_z80_im", null, ["number"]);
	instance.cwrap("set_z80_iff1", null, ["number"]);
	instance.cwrap("set_z80_iff2", null, ["number"]);
	instance.cwrap("set_z80_ei_pending", null, ["number"]);
	cpu_init = instance.cwrap("cpu_init", null);
	cpu_reset = instance.cwrap("cpu_reset", null);
	mem_read = instance.cwrap("mem_read", "number", ["number"]);
	mem_write = instance.cwrap("mem_write", null, ["number", "number"]);
	rom_load = instance.cwrap("rom_load", null, ["number", "number"]);
	instance.cwrap("io_read", "number", ["number"]);
	instance.cwrap("io_write", null, ["number", "number"]);
	instance.cwrap("lm80c_tick", "number");
	instance.cwrap("lm80c_set_debug", null, ["number"]);
	lm80c_init = instance.cwrap("lm80c_init", null, ["number"]);
	lm80c_reset = instance.cwrap("lm80c_reset", null);
	lm80c_ticks = instance.cwrap("lm80c_ticks", "number", ["number", "number"]);
	keyboard_reset = instance.cwrap("keyboard_reset", null);
	keyboard_press = instance.cwrap("keyboard_press", null, ["number", "number"]);
	instance.cwrap("keyboard_release", null, ["number", "number"]);
	instance.cwrap("keyboard_poll", "number", ["number"]);
	SIO_receiveChar = instance.cwrap("SIO_receiveChar", null, ["number"]);
	window.wasm_instance = instance;
	wasm_instance = instance;
}
var KA0 = 0;
var KA1 = 1;
var KA2 = 2;
var KA3 = 3;
var KA4 = 4;
var KA5 = 5;
var KA6 = 6;
var KA7 = 7;
var KB0 = 0;
var KB1 = 1;
var KB2 = 2;
var KB3 = 3;
var KB4 = 4;
var KB5 = 5;
var KB6 = 6;
var KB7 = 7;
var key_row_col = new Array(75);
function mapKey(key, row, col) {
	key_row_col[key] = {
		row,
		col
	};
}
mapKey(1, KB7, KA7);
mapKey(2, KB7, KA6);
mapKey(3, KB7, KA5);
mapKey(4, KB7, KA4);
mapKey(5, KB7, KA3);
mapKey(6, KB7, KA2);
mapKey(7, KB7, KA1);
mapKey(8, KB7, KA0);
mapKey(9, KB6, KA7);
mapKey(10, KB6, KA6);
mapKey(11, KB6, KA5);
mapKey(12, KB6, KA4);
mapKey(13, KB6, KA3);
mapKey(14, KB6, KA2);
mapKey(15, KB6, KA1);
mapKey(16, KB6, KA0);
mapKey(17, KB5, KA7);
mapKey(18, KB5, KA6);
mapKey(19, KB5, KA5);
mapKey(20, KB5, KA4);
mapKey(21, KB5, KA3);
mapKey(22, KB5, KA2);
mapKey(23, KB5, KA1);
mapKey(24, KB5, KA0);
mapKey(25, KB4, KA7);
mapKey(26, KB4, KA6);
mapKey(27, KB4, KA5);
mapKey(28, KB4, KA4);
mapKey(29, KB4, KA3);
mapKey(30, KB4, KA2);
mapKey(31, KB4, KA1);
mapKey(32, KB4, KA0);
mapKey(33, KB3, KA7);
mapKey(34, KB3, KA6);
mapKey(35, KB3, KA5);
mapKey(36, KB3, KA4);
mapKey(37, KB3, KA3);
mapKey(38, KB3, KA2);
mapKey(39, KB3, KA1);
mapKey(40, KB3, KA0);
mapKey(41, KB2, KA7);
mapKey(42, KB2, KA6);
mapKey(43, KB2, KA5);
mapKey(44, KB2, KA4);
mapKey(45, KB2, KA3);
mapKey(46, KB2, KA2);
mapKey(47, KB2, KA1);
mapKey(48, KB2, KA0);
mapKey(49, KB1, KA7);
mapKey(50, KB1, KA6);
mapKey(51, KB1, KA5);
mapKey(52, KB1, KA4);
mapKey(53, KB1, KA3);
mapKey(54, KB1, KA2);
mapKey(55, KB1, KA1);
mapKey(56, KB1, KA0);
mapKey(57, KB0, KA7);
mapKey(58, KB0, KA6);
mapKey(59, KB0, KA5);
mapKey(60, KB0, KA4);
mapKey(61, KB0, KA3);
mapKey(62, KB0, KA2);
mapKey(63, KB0, KA1);
mapKey(64, KB0, KA0);
function keyboardReset() {
	keyboard_reset();
}
function keyPress(hardware_key) {
	const { row, col } = key_row_col[hardware_key];
	keyboard_press(row, col);
}
//#endregion
//#region src/keyboard_IT.ts
function pckey_to_hardware_keys_ITA(code, key, e) {
	let hardware_keys = [];
	if (e.ctrlKey) hardware_keys.push(62);
	if (e.altKey) hardware_keys.push(59);
	let capsLockState = e.getModifierState("CapsLock");
	if (code === "Home" && e.shiftKey) hardware_keys.push(53, 63);
	if (key === "1") hardware_keys.push(64);
	if (key === "2") hardware_keys.push(57);
	if (key === "3") hardware_keys.push(56);
	if (key === "4") hardware_keys.push(49);
	if (key === "5") hardware_keys.push(48);
	if (key === "6") hardware_keys.push(41);
	if (key === "7") hardware_keys.push(40);
	if (key === "8") hardware_keys.push(33);
	if (key === "9") hardware_keys.push(32);
	if (key === "0") hardware_keys.push(25);
	if (e.shiftKey && !capsLockState || !e.shiftKey && capsLockState) {
		if (code === "KeyQ") hardware_keys.push(53, 58);
		if (code === "KeyW") hardware_keys.push(53, 55);
		if (code === "KeyE") hardware_keys.push(53, 50);
		if (code === "KeyR") hardware_keys.push(53, 47);
		if (code === "KeyT") hardware_keys.push(53, 42);
		if (code === "KeyY") hardware_keys.push(53, 39);
		if (code === "KeyU") hardware_keys.push(53, 34);
		if (code === "KeyI") hardware_keys.push(53, 31);
		if (code === "KeyO") hardware_keys.push(53, 26);
		if (code === "KeyP") hardware_keys.push(53, 23);
		if (code === "KeyA") hardware_keys.push(53, 54);
		if (code === "KeyS") hardware_keys.push(53, 51);
		if (code === "KeyD") hardware_keys.push(53, 46);
		if (code === "KeyF") hardware_keys.push(53, 43);
		if (code === "KeyG") hardware_keys.push(53, 38);
		if (code === "KeyH") hardware_keys.push(53, 35);
		if (code === "KeyJ") hardware_keys.push(53, 30);
		if (code === "KeyK") hardware_keys.push(53, 27);
		if (code === "KeyL") hardware_keys.push(53, 22);
		if (code === "KeyZ") hardware_keys.push(53, 52);
		if (code === "KeyX") hardware_keys.push(53, 45);
		if (code === "KeyC") hardware_keys.push(53, 44);
		if (code === "KeyV") hardware_keys.push(53, 37);
		if (code === "KeyB") hardware_keys.push(53, 36);
		if (code === "KeyN") hardware_keys.push(53, 29);
		if (code === "KeyM") hardware_keys.push(53, 28);
	} else {
		if (code === "KeyQ") hardware_keys.push(58);
		if (code === "KeyW") hardware_keys.push(55);
		if (code === "KeyE") hardware_keys.push(50);
		if (code === "KeyR") hardware_keys.push(47);
		if (code === "KeyT") hardware_keys.push(42);
		if (code === "KeyY") hardware_keys.push(39);
		if (code === "KeyU") hardware_keys.push(34);
		if (code === "KeyI") hardware_keys.push(31);
		if (code === "KeyO") hardware_keys.push(26);
		if (code === "KeyP") hardware_keys.push(23);
		if (code === "KeyA") hardware_keys.push(54);
		if (code === "KeyS") hardware_keys.push(51);
		if (code === "KeyD") hardware_keys.push(46);
		if (code === "KeyF") hardware_keys.push(43);
		if (code === "KeyG") hardware_keys.push(38);
		if (code === "KeyH") hardware_keys.push(35);
		if (code === "KeyJ") hardware_keys.push(30);
		if (code === "KeyK") hardware_keys.push(27);
		if (code === "KeyL") hardware_keys.push(22);
		if (code === "KeyZ") hardware_keys.push(52);
		if (code === "KeyX") hardware_keys.push(45);
		if (code === "KeyC") hardware_keys.push(44);
		if (code === "KeyV") hardware_keys.push(37);
		if (code === "KeyB") hardware_keys.push(36);
		if (code === "KeyN") hardware_keys.push(29);
		if (code === "KeyM") hardware_keys.push(28);
	}
	if (key === "!") hardware_keys.push(53, 64);
	if (key === "\"") hardware_keys.push(53, 57);
	if (key === "£") hardware_keys.push(6);
	if (key === "$") hardware_keys.push(53, 49);
	if (key === "%") hardware_keys.push(53, 48);
	if (key === "&") hardware_keys.push(53, 41);
	if (key === "/") hardware_keys.push(13);
	if (key === "(") hardware_keys.push(53, 33);
	if (key === ")") hardware_keys.push(53, 32);
	if (key === "=") hardware_keys.push(11);
	if (key === "'") hardware_keys.push(53, 40);
	if (key === "?") hardware_keys.push(53, 13);
	if (key === "^") hardware_keys.push(53, 25);
	if (key === "[") hardware_keys.push(53, 19);
	if (key === "]") hardware_keys.push(53, 14);
	if (key === "+") hardware_keys.push(10);
	if (key === "*") hardware_keys.push(15);
	if (key === "@") hardware_keys.push(5);
	if (key === "#") hardware_keys.push(53, 56);
	if (key === "<") hardware_keys.push(53, 21);
	if (key === ">") hardware_keys.push(53, 20);
	if (key === ",") hardware_keys.push(21);
	if (key === ";") hardware_keys.push(14);
	if (key === ".") hardware_keys.push(20);
	if (key === ":") hardware_keys.push(19);
	if (key === "-") hardware_keys.push(18);
	if (code === "F1") hardware_keys.push(4);
	if (code === "F2") hardware_keys.push(3);
	if (code === "F3") hardware_keys.push(2);
	if (code === "F4") hardware_keys.push(53, 4);
	if (code === "F5") hardware_keys.push(53, 3);
	if (code === "F6") hardware_keys.push(53, 2);
	if (code === "F7") hardware_keys.push(53, 1);
	if (code === "F8") hardware_keys.push(1);
	if (code === "F9") hardware_keys.push(1);
	if (code === "F10") hardware_keys.push(1);
	if (code === "Insert") hardware_keys.push(53, 8);
	if (code === "Delete") hardware_keys.push(8);
	if (code === "Escape") hardware_keys.push(12);
	if (code === "Backspace") hardware_keys.push(8);
	if (code === "End") hardware_keys.push(53, 63);
	if (code === "Home") hardware_keys.push(63);
	if (code === "Enter") hardware_keys.push(7);
	if (code === "NumpadEnter") hardware_keys.push(7);
	if (code === "ControlLeft") hardware_keys.push(62);
	if (code === "ControlRight") hardware_keys.push(62);
	if (code === "ArrowUp") hardware_keys.push(17);
	if (code === "ArrowDown") hardware_keys.push(24);
	if (code === "ArrowLeft") hardware_keys.push(16);
	if (code === "ArrowRight") hardware_keys.push(9);
	if (code === "Space") hardware_keys.push(60);
	if (code === "Tab") hardware_keys.push(61);
	if (key === "\\") hardware_keys.push(12);
	return hardware_keys;
}
//#endregion
//#region src/keyboard.ts
function keyDown(e) {
	audio.resume();
	if (e.repeat) {
		e.preventDefault();
		return;
	}
	if (e.code === "Pause" && e.altKey && e.ctrlKey) {
		cpu.reset();
		e.preventDefault();
		return;
	}
	{
		const hardware_keys = pckey_to_hardware_keys_ITA(e.code, e.key, e);
		if (hardware_keys.length === 0) return;
		keyboard_buffer.push({
			type: "press",
			hardware_keys
		});
		e.preventDefault();
	}
}
function keyUp(e) {
	const hardware_keys = pckey_to_hardware_keys_ITA(e.code, e.key, e);
	if (hardware_keys.length === 0) return;
	keyboard_buffer.push({
		type: "release",
		hardware_keys
	});
	e.preventDefault();
}
var element = document;
element.onkeydown = keyDown;
element.onkeyup = keyUp;
var keyboard_buffer = [];
//#endregion
//#region src/bytes.ts
function hex(value, size = 2) {
	if (size === void 0) size = 2;
	let s = "0000" + value.toString(16);
	return s.substr(s.length - size);
}
function hi(word) {
	return word >> 8 & 255;
}
function lo(word) {
	return word & 255;
}
function mem_write_word(address, word) {
	mem_write(address + 0, lo(word));
	mem_write(address + 1, hi(word));
}
function mem_read_word(address) {
	return mem_read(address + 0) + mem_read(address + 1) * 256;
}
function copyArray(source, dest) {
	source.forEach((e, i) => dest[i] = e);
}
function getFileExtension(fileName) {
	let s = fileName.toLowerCase().split(".");
	if (s.length == 1) return "";
	return "." + s[s.length - 1];
}
//#endregion
//#region src/files.ts
async function run(filename) {
	if (!await storage.fileExists(filename)) {
		console.log(`file "${filename}" not found`);
		return;
	}
	const ext = getFileExtension(filename);
	if (ext === ".prg") await load_prg(filename, true);
	else console.log(`extension '${ext}' not supported`);
}
async function load(filename) {
	if (!await storage.fileExists(filename)) {
		console.log(`file "${filename}" not found`);
		return;
	}
	const ext = getFileExtension(filename);
	if (ext === ".prg") await load_prg(filename, false);
	else console.log(`extension '${ext}' not supported`);
}
async function save(filename) {
	const ext = getFileExtension(filename);
	if (ext == ".prg") await save_prg(filename, void 0, void 0);
	else console.log(`extension '${ext}' not supported`);
}
function loadBytes(bytes, address, fileName) {
	const startAddress = address === void 0 ? mem_read_word(BASTXT) : address;
	const endAddress = startAddress + bytes.length - 1;
	for (let i = 0, t = startAddress; t <= endAddress; i++, t++) mem_write(t, bytes[i]);
	if (startAddress === mem_read_word(BASTXT)) mem_write_word(PROGND, endAddress + 1);
	if (fileName === void 0) fileName = "autoload";
	console.log(`loaded "${fileName}" ${bytes.length} bytes from ${hex(startAddress, 4)}h to ${hex(endAddress, 4)}h`);
}
async function load_prg(filename, runAfterLoad) {
	const bytes = await storage.readFile(filename);
	let VZ_BASIC = 240;
	let VZ_BINARY = 241;
	let VZ = {
		type: VZ_BASIC,
		filename,
		data: bytes,
		start: mem_read_word(BASTXT)
	};
	for (let i = 0; i < VZ.data.length; i++) mem_write(i + VZ.start, VZ.data[i]);
	if (VZ.type == VZ_BASIC) console.log(`loaded "${filename}" ('${VZ.filename}') as BASIC program of ${VZ.data.length} bytes from ${hex(VZ.start, 4)}h to ${hex(VZ.start + VZ.data.length, 4)}h`);
	else if (VZ.type == VZ_BINARY) console.log(`loaded "${filename}" ('${VZ.filename}') as binary data of ${VZ.data.length} bytes from ${hex(VZ.start, 4)}h to ${hex(VZ.start + VZ.data.length, 4)}h`);
	if (VZ.type == VZ_BINARY) {
		if (runAfterLoad) throw "not yet implemented";
	}
	if (VZ.type == VZ_BASIC) {
		let end = VZ.start + VZ.data.length;
		if (VZ.start === mem_read_word(BASTXT)) mem_write_word(PROGND, end + 1);
		if (runAfterLoad) paste("RUN\r\n");
	}
}
async function save_prg(filename, start, end) {
	if (start === void 0) start = mem_read_word(BASTXT);
	if (end === void 0) end = mem_read_word(PROGND) - 1;
	const prg = [];
	for (let i = 0, t = start; t <= end; i++, t++) prg.push(mem_read(t));
	const bytes = new Uint8Array(prg);
	await storage.writeFile(filename, bytes);
	console.log(`saved "${filename}" ${bytes.length} bytes from ${hex(start, 4)}h to ${hex(end, 4)}h`);
}
window.run = run;
window.load = load;
window.save = save;
window.loadBytes = loadBytes;
//#endregion
//#region src/utils.ts
function cpu_status() {
	const state = cpu.getState();
	return `A=${hex(state.a)} BC=${hex(state.b)}${hex(state.c)} DE=${hex(state.d)}${hex(state.e)} HL=${hex(state.h)}${hex(state.l)} IX=${hex(state.ix, 4)} IY=${hex(state.iy, 4)} SP=${hex(state.sp, 4)} PC=${hex(state.pc, 4)} S=${state.flags.S}, Z=${state.flags.Z}, Y=${state.flags.Y}, H=${state.flags.H}, X=${state.flags.X}, P=${state.flags.P}, N=${state.flags.N}, C=${state.flags.C}`;
}
async function crun(filename) {
	await load(filename);
	pasteLine("RUN\r\n");
}
function paste(text) {
	const lines = text.split("\n");
	for (let t = 0; t < lines.length; t++) {
		const linea = lines[t];
		console.log(linea);
		pasteLine(linea);
		pasteChar(13);
	}
}
function pasteLine(line) {
	renderFrame();
	for (let t = 0; t < line.length; t++) pasteChar(line.charCodeAt(t));
}
function pasteChar(c) {
	SIO_receiveChar(c);
}
function zap() {
	ram.forEach((e, i) => ram[i] = 0);
	let state = cpu.getState();
	state.halted = true;
	cpu.setState(state);
}
function power() {
	zap();
	setTimeout(() => cpu.reset(), 200);
}
function saveState() {
	const saveObject = {
		ram: Array.from(ram),
		cpu: cpu.getState()
	};
	window.localStorage.setItem(`lm80c_emu_state`, JSON.stringify(saveObject));
}
function restoreState() {
	try {
		let s = window.localStorage.getItem(`lm80c_emu_state`);
		if (s === null) return;
		let state = JSON.parse(s);
		copyArray(state.ram, ram);
		cpu.setState(state.cpu);
	} catch (error) {}
}
function dumpPointers() {
	console.log(`
   +------------------------+ <-  (0x${hex(PROGND, 4)}) ${hex(mem_read_word(PROGND), 4)}
   |     BASIC program      |
   +------------------------+ <- TXTTAB (0x${hex(BASTXT, 4)}) ${hex(mem_read_word(BASTXT), 4)}
   |    System variables    |
   +------------------------+ 0x8000
`);
}
function dumpStack() {
	const sp = cpu.getState().sp;
	for (let t = sp; t <= 65535; t += 2) {
		const word = mem_read_word(t);
		console.log(`${hex(t, 4)}: ${hex(word, 4)}  (${word})`);
	}
}
function make_lm(start, end, rows) {
	let s;
	s = `10 FOR T=&H${hex(start, 4)} TO &H${hex(end, 4)}\n`;
	s += `20 READ B:POKE T,B\n`;
	s += `30 NEXT\n`;
	s += `40 SYS &H${hex(start, 4)}\n`;
	s += `50 END\n`;
	let nline = 1e3;
	if (rows == void 0) rows = 8;
	for (let r = start; r <= end; r += rows) {
		s += `${nline} DATA `;
		for (let c = 0; c < rows && r + c <= end; c++) {
			const byte = mem_read(r + c);
			s += `${byte}`;
			if (c != rows - 1 && r + c != end) s += ",";
		}
		s += "\n";
		nline += 10;
	}
	console.log(s);
}
var counter = 0;
var counter_avg = 0;
function start_counter() {
	counter = (/* @__PURE__ */ new Date()).valueOf();
}
function stop_counter() {
	let now = (/* @__PURE__ */ new Date()).valueOf();
	let cnt = counter;
	if (cnt === 0) cnt = now;
	let elapsed = now - cnt;
	counter_avg = .9 * counter_avg + .1 * elapsed;
	return counter_avg;
}
var LED = 0;
function led_read() {
	return LED;
}
function led_write(value) {
	LED = value;
}
window.cpu_status = cpu_status;
window.crun = crun;
window.paste = paste;
window.zap = zap;
window.power = power;
window.saveState = saveState;
window.restoreState = restoreState;
window.dumpPointers = dumpPointers;
window.dumpStack = dumpStack;
window.make_lm = make_lm;
window.start_counter = start_counter;
window.stop_counter = stop_counter;
window.led_read = led_read;
window.led_write = led_write;
window.debugBefore = void 0;
window.debugAfter = void 0;
//#endregion
//#region src/video.ts
var frameCounter = 0;
function calculateGeometry() {
	let SCREEN_W = 272;
	let SCREEN_H = 224;
	let canvas = document.getElementById("canvas");
	if (canvas) {
		canvas.width = SCREEN_W * 2;
		canvas.height = SCREEN_H * 2;
	}
}
calculateGeometry();
var DOT_WIDTH = 342;
var DOT_HEIGHT = 262;
var tms9928a_canvas = document.getElementById("canvas");
var tms9928a_context = tms9928a_canvas ? tms9928a_canvas.getContext("2d") : null;
var tms9928a_imagedata = tms9928a_context ? tms9928a_context.createImageData(DOT_WIDTH * 2, DOT_HEIGHT * 2) : null;
var bmp = tms9928a_imagedata ? new Uint32Array(tms9928a_imagedata.data.buffer) : new Uint32Array(0);
function vdp_screen_update(ptr) {
	if (!tms9928a_context || !tms9928a_imagedata) return;
	let start = ptr / wasm_instance.HEAPU32.BYTES_PER_ELEMENT;
	let size = DOT_WIDTH * DOT_HEIGHT;
	let buffer = wasm_instance.HEAPU32.subarray(start, start + size);
	let ptr0 = 0;
	let ptr1 = 0;
	let ptr2 = DOT_WIDTH * 2;
	for (let y = 0; y < DOT_HEIGHT; y++) {
		for (let x = 0; x < DOT_WIDTH; x++) {
			let pixel = buffer[ptr0];
			bmp[ptr1++] = pixel;
			bmp[ptr1++] = pixel;
			bmp[ptr2++] = pixel;
			bmp[ptr2++] = pixel;
			ptr0++;
		}
		ptr1 += DOT_WIDTH * 2;
		ptr2 += DOT_WIDTH * 2;
	}
	tms9928a_context.putImageData(tms9928a_imagedata, -60, -48);
	frameCounter++;
	if (frameCounter % 60 == 0) {
		const ledEl = document.getElementById("LED");
		if (ledEl) ledEl.style.visibility = led_read() > 0 ? "visible" : "hidden";
	}
}
window.vdp_screen_update = vdp_screen_update;
//#endregion
//#region src/mdawson.ts
function externalLoad(url) {
	let subfile = "";
	let cmd = "externalLoad.load";
	let head = document.getElementsByTagName("head")[0];
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = `https://www.mdawson.net/vic20chrome/vic20/prgtojsloader.php?cmd=${cmd}&prgurl=${url}&subfile=${subfile}&rnd=${(/* @__PURE__ */ new Date()).valueOf()}`;
	head.appendChild(script);
	return new Promise((resolve, reject) => {
		externalLoad.resolve = resolve;
	});
}
externalLoad.load = function(src) {
	function encodedbinToArray(data) {
		let bincodes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.!";
		let v = 0, cnt = 0, out = [], ii = 0;
		for (let i = 0; i < data.length; i++) {
			v += bincodes.indexOf(data[i]) << cnt;
			cnt += 6;
			if (cnt >= 8) {
				out[ii++] = v & 255;
				cnt -= 8;
				v >>= 8;
			}
		}
		return out;
	}
	if (src.length !== 1) return;
	let bytes = encodedbinToArray(src[0]);
	externalLoad.resolve(bytes);
};
//#endregion
//#region src/browser.ts
var aspect = 1.25;
function onResize(e) {
	const canvas = document.getElementById("canvas");
	if (window.innerWidth > window.innerHeight * aspect) {
		canvas.style.width = `${aspect * 100}vmin`;
		canvas.style.height = "100vmin";
	} else if (window.innerWidth > window.innerHeight) {
		canvas.style.width = "100vmax";
		canvas.style.height = `${1 / aspect * 100}vmax`;
	} else {
		canvas.style.width = "100vmin";
		canvas.style.height = `${1 / aspect * 100}vmin`;
	}
}
function goFullScreen() {
	const canvas = document.getElementById("canvas");
	if (canvas) {
		if (canvas.webkitRequestFullscreen !== void 0) canvas.webkitRequestFullscreen();
		else if (canvas.mozRequestFullScreen !== void 0) canvas.mozRequestFullScreen();
	}
	onResize();
}
window.addEventListener("resize", onResize);
window.addEventListener("dblclick", goFullScreen);
onResize();
window.onbeforeunload = function(e) {
	saveState();
};
window.addEventListener("visibilitychange", function() {
	if (document.visibilityState === "hidden") {
		setStopped(true);
		audio.stop();
	} else if (document.visibilityState === "visible") {
		setStopped(false);
		oneFrame();
		audio.start();
	}
});
var dropZone = document.getElementById("screen");
if (dropZone) {
	dropZone.addEventListener("dragover", function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	});
	dropZone.addEventListener("drop", (e) => {
		audio.resume();
		e.stopPropagation();
		e.preventDefault();
		const files = e.dataTransfer.files;
		for (let i = 0, file; file = files[i]; i++) {
			const reader = new FileReader();
			reader.onload = (e2) => {
				if (e2.target && e2.target.result) droppedFile(file.name, new Uint8Array(e2.target.result));
			};
			reader.readAsArrayBuffer(file);
		}
	});
}
async function droppedFile(outName, bytes) {
	if (getFileExtension(outName) == ".prg") {
		await storage.writeFile(outName, bytes);
		await run(outName);
	}
}
window.droppedFile = droppedFile;
function getQueryStringObject(opts) {
	return window.location.search.split("&").reduce((o, v) => {
		var kv = v.split("=");
		const key = kv[0].replace("?", "");
		let value = kv[1];
		if (value === "true") value = true;
		else if (value === "false") value = false;
		o[key] = value;
		return o;
	}, opts);
}
async function parseQueryStringCommands() {
	Object.assign(options, getQueryStringObject(options));
	if (options.restore !== false) restoreState();
	if (options.load !== void 0) {
		const name = options.load;
		setTimeout(async () => {
			if (name.startsWith("http")) {
				let bin = await externalLoad(name);
				await storage.writeFile("autoload.prg", bin);
				await run("autoload.prg");
			} else await fetchProgram(name);
		}, 4e3);
	}
	if (options.bt !== void 0 || options.bb !== void 0 || options.bh !== void 0 || options.aspect !== void 0) {
		if (options.bt !== void 0) Number(options.bt);
		if (options.bb !== void 0) Number(options.bb);
		if (options.bh !== void 0) Number(options.bh);
		if (options.aspect !== void 0) aspect = Number(options.aspect);
		calculateGeometry();
		onResize();
	}
}
async function fetchProgram(name) {
	try {
		const response = await fetch(`software/${name}`);
		if (response.status === 404) return false;
		droppedFile(name, new Uint8Array(await response.arrayBuffer()));
		return true;
	} catch (err) {
		return false;
	}
}
//#endregion
//#region src/printer.ts
var printerBuffer = "";
var printerTimeLastReceived;
function checkPrinterBuffer() {
	if ((/* @__PURE__ */ new Date()).getTime() - printerTimeLastReceived > 2e3 && printerBuffer !== "") {
		console.log(printerBuffer);
		printerBuffer = "";
		return;
	}
	setTimeout(() => checkPrinterBuffer(), 2e3);
}
function printerWrite(byte) {
	printerBuffer += String.fromCharCode(byte & 255);
	printerTimeLastReceived = /* @__PURE__ */ new Date();
	checkPrinterBuffer();
}
//#endregion
//#region src/emulator.ts
var LM80C_model = 0;
var BASTXT = 33075;
var PROGND = 33211;
var cpu;
var cpuSpeed = 3686400;
var vdcSpeed = 10738635;
var frameRate = vdcSpeed / (342 * 262 * 2);
var cyclesPerLine = cpuSpeed / vdcSpeed * 342;
var stopped = false;
var averageFrameTime = 0;
var total_cycles = 0;
var options = {
	load: void 0,
	restore: false
};
var audio = new LMAudio(4096);
var storage = new BrowserStorage("lm80c");
function renderFrame() {
	total_cycles += lm80c_ticks(262 * 2 * cyclesPerLine);
}
function poll_keyboard() {
	if (keyboard_buffer.length > 0) {
		let key_event = keyboard_buffer.shift();
		if (key_event) {
			keyboardReset();
			if (key_event.type === "press") key_event.hardware_keys.forEach((k) => keyPress(k));
		}
	}
}
var end_of_frame_hook = void 0;
var last_timestamp = 0;
function oneFrame(timestamp) {
	let stamp = timestamp == void 0 ? last_timestamp : timestamp;
	let msec = stamp - last_timestamp;
	let cycles = cpuSpeed * msec / 1e3;
	last_timestamp = stamp;
	if (msec > frameRate * 2) cycles = cpuSpeed * (frameRate * 2 / 1e3);
	poll_keyboard();
	total_cycles += lm80c_ticks(cycles, cyclesPerLine);
	averageFrameTime = averageFrameTime * .992 + msec * .008;
	if (!stopped) requestAnimationFrame(oneFrame);
}
function main() {
	parseQueryStringCommands();
	{
		let firmware;
		if (options.rom == void 0) options.rom = "64K120";
		if (options.rom == "310") firmware = rom_310;
		if (options.rom == "311") firmware = rom_311;
		if (options.rom == "312") firmware = rom_312;
		if (options.rom == "313") firmware = rom_313;
		if (options.rom == "3131") firmware = rom_3131;
		if (options.rom == "3132") firmware = rom_3132;
		if (options.rom == "3133") firmware = rom_3133;
		if (options.rom == "3134") firmware = rom_3134;
		if (options.rom == "3135") firmware = rom_3135;
		if (options.rom == "3136") firmware = rom_3136;
		if (options.rom == "3137") firmware = rom_3137;
		if (options.rom == "3138") firmware = rom_3138;
		if (options.rom == "314") {
			firmware = rom_314;
			BASTXT = 33075;
			PROGND = 33211;
			LM80C_model = 0;
		}
		if (options.rom == "315") {
			firmware = rom_315;
			BASTXT = 33075;
			PROGND = 33211;
			LM80C_model = 0;
		}
		if (options.rom == "316") {
			firmware = rom_316;
			BASTXT = 33075;
			PROGND = 33310;
			LM80C_model = 0;
		}
		if (options.rom == "317") {
			firmware = rom_317;
			BASTXT = 33077;
			PROGND = 33316;
			LM80C_model = 0;
		}
		if (options.rom == "318") {
			firmware = rom_318;
			BASTXT = 33077;
			PROGND = 33316;
			LM80C_model = 0;
		}
		if (options.rom == "319") {
			firmware = rom_319;
			BASTXT = 33077;
			PROGND = 33315;
			LM80C_model = 0;
		}
		if (options.rom == "321") {
			firmware = rom_321;
			BASTXT = 33077;
			PROGND = 33355;
			LM80C_model = 0;
		}
		if (options.rom == "322") {
			firmware = rom_322;
			BASTXT = 33077;
			PROGND = 33355;
			LM80C_model = 0;
		}
		if (options.rom == "323") {
			firmware = rom_323;
			BASTXT = 33077;
			PROGND = 33356;
			LM80C_model = 0;
		}
		if (options.rom == "324") {
			firmware = rom_324;
			BASTXT = 33077;
			PROGND = 33356;
			LM80C_model = 0;
		}
		if (options.rom == "64K102") {
			firmware = rom_64K_102;
			BASTXT = 21043;
			PROGND = 21282;
			LM80C_model = 1;
		}
		if (options.rom == "64K103") {
			firmware = rom_64K_103;
			BASTXT = 21028;
			PROGND = 21267;
			LM80C_model = 1;
		}
		if (options.rom == "64K104") {
			firmware = rom_64K_104;
			BASTXT = 21076;
			PROGND = 21315;
			LM80C_model = 1;
		}
		if (options.rom == "64K105") {
			firmware = rom_64K_105;
			BASTXT = 21114;
			PROGND = 21352;
			LM80C_model = 1;
		}
		if (options.rom == "64K111") {
			firmware = rom_64K_111;
			BASTXT = 24654;
			PROGND = 24932;
			LM80C_model = 1;
		}
		if (options.rom == "64K112") {
			firmware = rom_64K_112;
			BASTXT = 24718;
			PROGND = 24996;
			LM80C_model = 1;
		}
		if (options.rom == "64K113") {
			firmware = rom_64K_113;
			BASTXT = 24726;
			PROGND = 25005;
			LM80C_model = 1;
		}
		if (options.rom == "64K114") {
			firmware = rom_64K_114;
			BASTXT = 24746;
			PROGND = 25025;
			LM80C_model = 1;
		}
		if (options.rom == "64K115") {
			firmware = rom_64K_115;
			BASTXT = 21619;
			PROGND = 21894;
			LM80C_model = 1;
		}
		if (options.rom == "64K116") {
			firmware = rom_64K_116;
			BASTXT = 21679;
			PROGND = 21954;
			LM80C_model = 1;
		}
		if (options.rom == "64K117") {
			firmware = rom_64K_117;
			BASTXT = 21679;
			PROGND = 21954;
			LM80C_model = 1;
		}
		if (options.rom == "64K118") {
			firmware = rom_64K_118;
			BASTXT = 21713;
			PROGND = 21988;
			LM80C_model = 1;
		}
		if (options.rom == "64K119") {
			firmware = rom_64K_119;
			BASTXT = 21720;
			PROGND = 21995;
			LM80C_model = 1;
		}
		if (options.rom == "64K120") {
			firmware = rom_64K_120;
			BASTXT = 21720;
			PROGND = 21995;
			LM80C_model = 1;
		}
		firmware.forEach((v, i) => rom_load(i, v));
	}
	const bit = (val, n) => (val & 1 << n) > 0 ? 1 : 0;
	cpu = {
		init: cpu_init,
		reset: cpu_reset,
		getState: () => {
			return {
				a: get_z80_a(),
				f: get_z80_f(),
				b: get_z80_b(),
				c: get_z80_c(),
				d: get_z80_d(),
				e: get_z80_e(),
				h: get_z80_h(),
				l: get_z80_l(),
				ix: get_z80_ix(),
				iy: get_z80_iy(),
				sp: get_z80_sp(),
				pc: get_z80_pc(),
				flags: {
					S: bit(get_z80_f(), 7),
					Z: bit(get_z80_f(), 6),
					Y: bit(get_z80_f(), 5),
					H: bit(get_z80_f(), 4),
					X: bit(get_z80_f(), 3),
					P: bit(get_z80_f(), 2),
					N: bit(get_z80_f(), 1),
					C: bit(get_z80_f(), 0)
				}
			};
		},
		setState: (state) => {
			set_z80_a(state.a);
			set_z80_f(state.f);
			set_z80_b(state.b);
			set_z80_c(state.c);
			set_z80_d(state.d);
			set_z80_e(state.e);
			set_z80_h(state.h);
			set_z80_l(state.l);
			set_z80_ix(state.ix);
			set_z80_iy(state.iy);
			set_z80_sp(state.sp);
			set_z80_pc(state.pc);
		}
	};
	window.cpu = cpu;
	cpu.init();
	cpu.reset();
	keyboard_reset();
	psg_init();
	psg_reset();
	ctc_init();
	ctc_reset();
	lm80c_init(LM80C_model);
	lm80c_reset();
	audio.start();
	oneFrame();
}
function ay38910_audio_buf_ready(ptr, size) {
	if (!audio.playing) return;
	let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
	let buffer = wasm_instance.HEAPF32.subarray(start, start + size);
	audio.playBuffer(buffer);
}
var sio_write_data = function(port, data) {
	printerWrite(data);
};
var sio_write_control = function(port, data) {};
window.sio_write_data = sio_write_data;
window.sio_write_control = sio_write_control;
window.ay38910_audio_buf_ready = ay38910_audio_buf_ready;
function setStopped(val) {
	stopped = val;
}
window.main = main;
window.BBS = BBS;
//#endregion
export { BASTXT, PROGND, audio, averageFrameTime, cpu, end_of_frame_hook, load_wasm, main, oneFrame, options, renderFrame, setStopped, stopped, storage };
