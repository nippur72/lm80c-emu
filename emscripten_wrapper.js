
let wasm_instance;
let test_function;

let psg_init;
let psg_reset;
let psg_ticks;
let psg_read;
let psg_write;

let psg_generic_io_read;
let psg_generic_io_write;

let psg_query_reg;
let psg_query_addr;

let ctc_init;
let ctc_reset;
let ctc_ticks;
let ctc_read;
let ctc_write;
let ctc_set_reti;
let ctc_int_ack;

function load_wasm(ready_cb) {

   // emscripten_module.js exports "emscripten_module" globally

   let instance = emscripten_module({ wasmBinary: emscripten_wasm_binary, onRuntimeInitialized: ()=>{
      // makes C exported functions available globally
      test_function = instance.cwrap("test_function");

      psg_init  = instance.cwrap("psg_init");
      psg_reset = instance.cwrap("psg_reset");
      psg_ticks = instance.cwrap("psg_ticks", 'void', ['number']);
      psg_read  = instance.cwrap("psg_read", 'number', ['number']);
      psg_write = instance.cwrap("psg_write", null, ['number', 'number']);

      psg_generic_io_read  = instance.cwrap("psg_generic_io_read", 'number', ['number', 'number']);
      psg_generic_io_write = instance.cwrap("psg_generic_io_write", 'number' , ['number', 'number', 'number']);
      psg_query_reg = instance.cwrap("psg_query_reg", 'number' , ['number']);
      psg_query_addr = instance.cwrap("psg_query_addr", 'number');

      ctc_init     = instance.cwrap("ctc_init");
      ctc_reset    = instance.cwrap("ctc_reset");      
      ctc_ticks    = instance.cwrap("ctc_ticks", 'number', ['number']);
      ctc_read     = instance.cwrap("ctc_read", 'number', ['number']);
      ctc_write    = instance.cwrap("ctc_write", null, ['number', 'number']);
      ctc_set_reti = instance.cwrap("ctc_set_reti");
      ctc_int_ack  = instance.cwrap("ctc_int_ack", 'number');

      // export instance globally (not strictly required)
      wasm_instance = instance;

      // finished
      ready_cb();
   }});
}

