
var emscripten_module = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(emscripten_module) {
  emscripten_module = emscripten_module || {};

var Module=typeof emscripten_module!=="undefined"?emscripten_module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=true;var ENVIRONMENT_IS_WORKER=false;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(document.currentScript){scriptDirectory=document.currentScript.src}if(_scriptDir){scriptDirectory=_scriptDir}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function readBinary(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime;if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(typeof WebAssembly!=="object"){err("no native wasm support detected")}var wasmMemory;var wasmTable=new WebAssembly.Table({"initial":6,"maximum":6+0,"element":"anyfunc"});var ABORT=false;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];assert(func,"Cannot call unknown function "+ident+", make sure it is exported");return func}function ccall(ident,returnType,argTypes,args,opts){var toC={"string":function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=stackAlloc(len);stringToUTF8(str,ret,len)}return ret},"array":function(arr){var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string")return UTF8ToString(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);ret=convertReturnValue(ret);if(stack!==0)stackRestore(stack);return ret}function cwrap(ident,returnType,argTypes,opts){argTypes=argTypes||[];var numericArgs=argTypes.every(function(type){return type==="number"});var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return function(){return ccall(ident,returnType,argTypes,arguments,opts)}}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx,endPtr))}else{var str="";while(idx<endPtr){var u0=heap[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}}heap[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}var UTF16Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer)}var WASM_PAGE_SIZE=65536;var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var DYNAMIC_BASE=5774784,DYNAMICTOP_PTR=531744;var INITIAL_INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;if(Module["wasmMemory"]){wasmMemory=Module["wasmMemory"]}else{wasmMemory=new WebAssembly.Memory({"initial":INITIAL_INITIAL_MEMORY/WASM_PAGE_SIZE,"maximum":INITIAL_INITIAL_MEMORY/WASM_PAGE_SIZE})}if(wasmMemory){buffer=wasmMemory.buffer}INITIAL_INITIAL_MEMORY=buffer.byteLength;updateGlobalBufferAndViews(buffer);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func)}else{Module["dynCall_vi"](func,callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}what+="";out(what);err(what);ABORT=true;EXITSTATUS=1;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";throw new WebAssembly.RuntimeError(what)}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var wasmBinaryFile="emscripten_module.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(){try{if(wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(wasmBinaryFile)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary()})}return new Promise(function(resolve,reject){resolve(getBinary())})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiatedSource(output){receiveInstance(output["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");instantiateArrayBuffer(receiveInstantiatedSource)})})}else{return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}var ASM_CONSTS={1024:function($0,$1){sio_write_control($0,$1)},1054:function($0,$1){sio_write_data($0,$1)},1168:function($0,$1){return ay38910_audio_buf_ready($0,$1)},1212:function(){return led_read()},1235:function($0){led_write($0)},1254:function($0){return cf_read($0)},1277:function($0,$1){cf_write($0,$1)},1307:function($0){vdp_screen_update($0)},1600:function(){if(debugBefore!==undefined)debugBefore()},1648:function(){if(debugAfter!==undefined)debugAfter()}};function _emscripten_asm_const_iii(code,sigPtr,argbuf){var args=readAsmConstArgs(sigPtr,argbuf);return ASM_CONSTS[code].apply(null,args)}__ATINIT__.push({func:function(){___wasm_call_ctors()}});function readAsmConstArgs(sigPtr,buf){if(!readAsmConstArgs.array){readAsmConstArgs.array=[]}var args=readAsmConstArgs.array;args.length=0;var ch;while(ch=HEAPU8[sigPtr++]){if(ch===100||ch===102){buf=buf+7&~7;args.push(HEAPF64[buf>>3]);buf+=8}else{buf=buf+3&~3;args.push(HEAP32[buf>>2]);buf+=4}}return args}var asmLibraryArg={"a":_emscripten_asm_const_iii,"memory":wasmMemory,"table":wasmTable};var asm=createWasm();Module["asm"]=asm;var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["b"]).apply(null,arguments)};var _keyboard_reset=Module["_keyboard_reset"]=function(){return(_keyboard_reset=Module["_keyboard_reset"]=Module["asm"]["c"]).apply(null,arguments)};var _keyboard_press=Module["_keyboard_press"]=function(){return(_keyboard_press=Module["_keyboard_press"]=Module["asm"]["d"]).apply(null,arguments)};var _keyboard_release=Module["_keyboard_release"]=function(){return(_keyboard_release=Module["_keyboard_release"]=Module["asm"]["e"]).apply(null,arguments)};var _keyboard_poll=Module["_keyboard_poll"]=function(){return(_keyboard_poll=Module["_keyboard_poll"]=Module["asm"]["f"]).apply(null,arguments)};var _ctc_init=Module["_ctc_init"]=function(){return(_ctc_init=Module["_ctc_init"]=Module["asm"]["g"]).apply(null,arguments)};var _ctc_reset=Module["_ctc_reset"]=function(){return(_ctc_reset=Module["_ctc_reset"]=Module["asm"]["h"]).apply(null,arguments)};var _ctc_set_reti=Module["_ctc_set_reti"]=function(){return(_ctc_set_reti=Module["_ctc_set_reti"]=Module["asm"]["i"]).apply(null,arguments)};var _ctc_int_ack_vector=Module["_ctc_int_ack_vector"]=function(){return(_ctc_int_ack_vector=Module["_ctc_int_ack_vector"]=Module["asm"]["j"]).apply(null,arguments)};var _ctc_ticks=Module["_ctc_ticks"]=function(){return(_ctc_ticks=Module["_ctc_ticks"]=Module["asm"]["k"]).apply(null,arguments)};var _ctc_read=Module["_ctc_read"]=function(){return(_ctc_read=Module["_ctc_read"]=Module["asm"]["l"]).apply(null,arguments)};var _ctc_write=Module["_ctc_write"]=function(){return(_ctc_write=Module["_ctc_write"]=Module["asm"]["m"]).apply(null,arguments)};var _SIO_receiveChar=Module["_SIO_receiveChar"]=function(){return(_SIO_receiveChar=Module["_SIO_receiveChar"]=Module["asm"]["n"]).apply(null,arguments)};var _psg_init=Module["_psg_init"]=function(){return(_psg_init=Module["_psg_init"]=Module["asm"]["o"]).apply(null,arguments)};var _psg_reset=Module["_psg_reset"]=function(){return(_psg_reset=Module["_psg_reset"]=Module["asm"]["p"]).apply(null,arguments)};var _psg_ticks=Module["_psg_ticks"]=function(){return(_psg_ticks=Module["_psg_ticks"]=Module["asm"]["q"]).apply(null,arguments)};var _psg_write=Module["_psg_write"]=function(){return(_psg_write=Module["_psg_write"]=Module["asm"]["r"]).apply(null,arguments)};var _psg_read=Module["_psg_read"]=function(){return(_psg_read=Module["_psg_read"]=Module["asm"]["s"]).apply(null,arguments)};var _test_function=Module["_test_function"]=function(){return(_test_function=Module["_test_function"]=Module["asm"]["t"]).apply(null,arguments)};var _mem_read=Module["_mem_read"]=function(){return(_mem_read=Module["_mem_read"]=Module["asm"]["u"]).apply(null,arguments)};var _mem_write=Module["_mem_write"]=function(){return(_mem_write=Module["_mem_write"]=Module["asm"]["v"]).apply(null,arguments)};var _rom_load=Module["_rom_load"]=function(){return(_rom_load=Module["_rom_load"]=Module["asm"]["w"]).apply(null,arguments)};var _io_read=Module["_io_read"]=function(){return(_io_read=Module["_io_read"]=Module["asm"]["x"]).apply(null,arguments)};var _io_write=Module["_io_write"]=function(){return(_io_write=Module["_io_write"]=Module["asm"]["y"]).apply(null,arguments)};var _lm80c_ctc_enable=Module["_lm80c_ctc_enable"]=function(){return(_lm80c_ctc_enable=Module["_lm80c_ctc_enable"]=Module["asm"]["z"]).apply(null,arguments)};var _cpu_init=Module["_cpu_init"]=function(){return(_cpu_init=Module["_cpu_init"]=Module["asm"]["A"]).apply(null,arguments)};var _cpu_reset=Module["_cpu_reset"]=function(){return(_cpu_reset=Module["_cpu_reset"]=Module["asm"]["B"]).apply(null,arguments)};var _get_z80_a=Module["_get_z80_a"]=function(){return(_get_z80_a=Module["_get_z80_a"]=Module["asm"]["C"]).apply(null,arguments)};var _get_z80_f=Module["_get_z80_f"]=function(){return(_get_z80_f=Module["_get_z80_f"]=Module["asm"]["D"]).apply(null,arguments)};var _get_z80_l=Module["_get_z80_l"]=function(){return(_get_z80_l=Module["_get_z80_l"]=Module["asm"]["E"]).apply(null,arguments)};var _get_z80_h=Module["_get_z80_h"]=function(){return(_get_z80_h=Module["_get_z80_h"]=Module["asm"]["F"]).apply(null,arguments)};var _get_z80_e=Module["_get_z80_e"]=function(){return(_get_z80_e=Module["_get_z80_e"]=Module["asm"]["G"]).apply(null,arguments)};var _get_z80_d=Module["_get_z80_d"]=function(){return(_get_z80_d=Module["_get_z80_d"]=Module["asm"]["H"]).apply(null,arguments)};var _get_z80_c=Module["_get_z80_c"]=function(){return(_get_z80_c=Module["_get_z80_c"]=Module["asm"]["I"]).apply(null,arguments)};var _get_z80_b=Module["_get_z80_b"]=function(){return(_get_z80_b=Module["_get_z80_b"]=Module["asm"]["J"]).apply(null,arguments)};var _get_z80_fa=Module["_get_z80_fa"]=function(){return(_get_z80_fa=Module["_get_z80_fa"]=Module["asm"]["K"]).apply(null,arguments)};var _get_z80_af=Module["_get_z80_af"]=function(){return(_get_z80_af=Module["_get_z80_af"]=Module["asm"]["L"]).apply(null,arguments)};var _get_z80_hl=Module["_get_z80_hl"]=function(){return(_get_z80_hl=Module["_get_z80_hl"]=Module["asm"]["M"]).apply(null,arguments)};var _get_z80_de=Module["_get_z80_de"]=function(){return(_get_z80_de=Module["_get_z80_de"]=Module["asm"]["N"]).apply(null,arguments)};var _get_z80_bc=Module["_get_z80_bc"]=function(){return(_get_z80_bc=Module["_get_z80_bc"]=Module["asm"]["O"]).apply(null,arguments)};var _get_z80_fa_=Module["_get_z80_fa_"]=function(){return(_get_z80_fa_=Module["_get_z80_fa_"]=Module["asm"]["P"]).apply(null,arguments)};var _get_z80_af_=Module["_get_z80_af_"]=function(){return(_get_z80_af_=Module["_get_z80_af_"]=Module["asm"]["Q"]).apply(null,arguments)};var _get_z80_hl_=Module["_get_z80_hl_"]=function(){return(_get_z80_hl_=Module["_get_z80_hl_"]=Module["asm"]["R"]).apply(null,arguments)};var _get_z80_de_=Module["_get_z80_de_"]=function(){return(_get_z80_de_=Module["_get_z80_de_"]=Module["asm"]["S"]).apply(null,arguments)};var _get_z80_bc_=Module["_get_z80_bc_"]=function(){return(_get_z80_bc_=Module["_get_z80_bc_"]=Module["asm"]["T"]).apply(null,arguments)};var _get_z80_sp=Module["_get_z80_sp"]=function(){return(_get_z80_sp=Module["_get_z80_sp"]=Module["asm"]["U"]).apply(null,arguments)};var _get_z80_iy=Module["_get_z80_iy"]=function(){return(_get_z80_iy=Module["_get_z80_iy"]=Module["asm"]["V"]).apply(null,arguments)};var _get_z80_ix=Module["_get_z80_ix"]=function(){return(_get_z80_ix=Module["_get_z80_ix"]=Module["asm"]["W"]).apply(null,arguments)};var _get_z80_wz=Module["_get_z80_wz"]=function(){return(_get_z80_wz=Module["_get_z80_wz"]=Module["asm"]["X"]).apply(null,arguments)};var _get_z80_pc=Module["_get_z80_pc"]=function(){return(_get_z80_pc=Module["_get_z80_pc"]=Module["asm"]["Y"]).apply(null,arguments)};var _get_z80_ir=Module["_get_z80_ir"]=function(){return(_get_z80_ir=Module["_get_z80_ir"]=Module["asm"]["Z"]).apply(null,arguments)};var _get_z80_i=Module["_get_z80_i"]=function(){return(_get_z80_i=Module["_get_z80_i"]=Module["asm"]["_"]).apply(null,arguments)};var _get_z80_r=Module["_get_z80_r"]=function(){return(_get_z80_r=Module["_get_z80_r"]=Module["asm"]["$"]).apply(null,arguments)};var _get_z80_im=Module["_get_z80_im"]=function(){return(_get_z80_im=Module["_get_z80_im"]=Module["asm"]["aa"]).apply(null,arguments)};var _get_z80_iff1=Module["_get_z80_iff1"]=function(){return(_get_z80_iff1=Module["_get_z80_iff1"]=Module["asm"]["ba"]).apply(null,arguments)};var _get_z80_iff2=Module["_get_z80_iff2"]=function(){return(_get_z80_iff2=Module["_get_z80_iff2"]=Module["asm"]["ca"]).apply(null,arguments)};var _get_z80_ei_pending=Module["_get_z80_ei_pending"]=function(){return(_get_z80_ei_pending=Module["_get_z80_ei_pending"]=Module["asm"]["da"]).apply(null,arguments)};var _set_z80_a=Module["_set_z80_a"]=function(){return(_set_z80_a=Module["_set_z80_a"]=Module["asm"]["ea"]).apply(null,arguments)};var _set_z80_f=Module["_set_z80_f"]=function(){return(_set_z80_f=Module["_set_z80_f"]=Module["asm"]["fa"]).apply(null,arguments)};var _set_z80_l=Module["_set_z80_l"]=function(){return(_set_z80_l=Module["_set_z80_l"]=Module["asm"]["ga"]).apply(null,arguments)};var _set_z80_h=Module["_set_z80_h"]=function(){return(_set_z80_h=Module["_set_z80_h"]=Module["asm"]["ha"]).apply(null,arguments)};var _set_z80_e=Module["_set_z80_e"]=function(){return(_set_z80_e=Module["_set_z80_e"]=Module["asm"]["ia"]).apply(null,arguments)};var _set_z80_d=Module["_set_z80_d"]=function(){return(_set_z80_d=Module["_set_z80_d"]=Module["asm"]["ja"]).apply(null,arguments)};var _set_z80_c=Module["_set_z80_c"]=function(){return(_set_z80_c=Module["_set_z80_c"]=Module["asm"]["ka"]).apply(null,arguments)};var _set_z80_b=Module["_set_z80_b"]=function(){return(_set_z80_b=Module["_set_z80_b"]=Module["asm"]["la"]).apply(null,arguments)};var _set_z80_af=Module["_set_z80_af"]=function(){return(_set_z80_af=Module["_set_z80_af"]=Module["asm"]["ma"]).apply(null,arguments)};var _set_z80_fa=Module["_set_z80_fa"]=function(){return(_set_z80_fa=Module["_set_z80_fa"]=Module["asm"]["na"]).apply(null,arguments)};var _set_z80_hl=Module["_set_z80_hl"]=function(){return(_set_z80_hl=Module["_set_z80_hl"]=Module["asm"]["oa"]).apply(null,arguments)};var _set_z80_de=Module["_set_z80_de"]=function(){return(_set_z80_de=Module["_set_z80_de"]=Module["asm"]["pa"]).apply(null,arguments)};var _set_z80_bc=Module["_set_z80_bc"]=function(){return(_set_z80_bc=Module["_set_z80_bc"]=Module["asm"]["qa"]).apply(null,arguments)};var _set_z80_fa_=Module["_set_z80_fa_"]=function(){return(_set_z80_fa_=Module["_set_z80_fa_"]=Module["asm"]["ra"]).apply(null,arguments)};var _set_z80_af_=Module["_set_z80_af_"]=function(){return(_set_z80_af_=Module["_set_z80_af_"]=Module["asm"]["sa"]).apply(null,arguments)};var _set_z80_hl_=Module["_set_z80_hl_"]=function(){return(_set_z80_hl_=Module["_set_z80_hl_"]=Module["asm"]["ta"]).apply(null,arguments)};var _set_z80_de_=Module["_set_z80_de_"]=function(){return(_set_z80_de_=Module["_set_z80_de_"]=Module["asm"]["ua"]).apply(null,arguments)};var _set_z80_bc_=Module["_set_z80_bc_"]=function(){return(_set_z80_bc_=Module["_set_z80_bc_"]=Module["asm"]["va"]).apply(null,arguments)};var _set_z80_sp=Module["_set_z80_sp"]=function(){return(_set_z80_sp=Module["_set_z80_sp"]=Module["asm"]["wa"]).apply(null,arguments)};var _set_z80_iy=Module["_set_z80_iy"]=function(){return(_set_z80_iy=Module["_set_z80_iy"]=Module["asm"]["xa"]).apply(null,arguments)};var _set_z80_ix=Module["_set_z80_ix"]=function(){return(_set_z80_ix=Module["_set_z80_ix"]=Module["asm"]["ya"]).apply(null,arguments)};var _set_z80_wz=Module["_set_z80_wz"]=function(){return(_set_z80_wz=Module["_set_z80_wz"]=Module["asm"]["za"]).apply(null,arguments)};var _set_z80_pc=Module["_set_z80_pc"]=function(){return(_set_z80_pc=Module["_set_z80_pc"]=Module["asm"]["Aa"]).apply(null,arguments)};var _set_z80_ir=Module["_set_z80_ir"]=function(){return(_set_z80_ir=Module["_set_z80_ir"]=Module["asm"]["Ba"]).apply(null,arguments)};var _set_z80_i=Module["_set_z80_i"]=function(){return(_set_z80_i=Module["_set_z80_i"]=Module["asm"]["Ca"]).apply(null,arguments)};var _set_z80_r=Module["_set_z80_r"]=function(){return(_set_z80_r=Module["_set_z80_r"]=Module["asm"]["Da"]).apply(null,arguments)};var _set_z80_im=Module["_set_z80_im"]=function(){return(_set_z80_im=Module["_set_z80_im"]=Module["asm"]["Ea"]).apply(null,arguments)};var _set_z80_iff1=Module["_set_z80_iff1"]=function(){return(_set_z80_iff1=Module["_set_z80_iff1"]=Module["asm"]["Fa"]).apply(null,arguments)};var _set_z80_iff2=Module["_set_z80_iff2"]=function(){return(_set_z80_iff2=Module["_set_z80_iff2"]=Module["asm"]["Ga"]).apply(null,arguments)};var _set_z80_ei_pending=Module["_set_z80_ei_pending"]=function(){return(_set_z80_ei_pending=Module["_set_z80_ei_pending"]=Module["asm"]["Ha"]).apply(null,arguments)};var _lm80c_set_debug=Module["_lm80c_set_debug"]=function(){return(_lm80c_set_debug=Module["_lm80c_set_debug"]=Module["asm"]["Ia"]).apply(null,arguments)};var _lm80c_tick=Module["_lm80c_tick"]=function(){return(_lm80c_tick=Module["_lm80c_tick"]=Module["asm"]["Ja"]).apply(null,arguments)};var _lm80c_ticks=Module["_lm80c_ticks"]=function(){return(_lm80c_ticks=Module["_lm80c_ticks"]=Module["asm"]["Ka"]).apply(null,arguments)};var _lm80c_init=Module["_lm80c_init"]=function(){return(_lm80c_init=Module["_lm80c_init"]=Module["asm"]["La"]).apply(null,arguments)};var _lm80c_reset=Module["_lm80c_reset"]=function(){return(_lm80c_reset=Module["_lm80c_reset"]=Module["asm"]["Ma"]).apply(null,arguments)};var stackSave=Module["stackSave"]=function(){return(stackSave=Module["stackSave"]=Module["asm"]["Na"]).apply(null,arguments)};var stackAlloc=Module["stackAlloc"]=function(){return(stackAlloc=Module["stackAlloc"]=Module["asm"]["Oa"]).apply(null,arguments)};var stackRestore=Module["stackRestore"]=function(){return(stackRestore=Module["stackRestore"]=Module["asm"]["Pa"]).apply(null,arguments)};var dynCall_vi=Module["dynCall_vi"]=function(){return(dynCall_vi=Module["dynCall_vi"]=Module["asm"]["Qa"]).apply(null,arguments)};Module["asm"]=asm;Module["ccall"]=ccall;Module["cwrap"]=cwrap;var calledRun;Module["then"]=function(func){if(calledRun){func(Module)}else{var old=Module["onRuntimeInitialized"];Module["onRuntimeInitialized"]=function(){if(old)old();func(Module)}}return Module};dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0)return;function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}noExitRuntime=true;run();


  return emscripten_module
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = emscripten_module;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return emscripten_module; });
    else if (typeof exports === 'object')
      exports["emscripten_module"] = emscripten_module;
    