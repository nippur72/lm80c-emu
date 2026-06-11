
import { EmscriptenInstance } from './types';

// Type aliases for WASM-exported function signatures
type WasmVoidFn = () => void;
type WasmGetFn = () => number;
type WasmSet1Fn = (value: number) => void;
type WasmGet1Fn = (addr: number) => number;
type WasmSet2Fn = (a: number, b: number) => void;
type WasmGet2Fn = (a: number, b: number) => number;

let wasm_instance: EmscriptenInstance;
let test_function: WasmVoidFn;

let psg_init: WasmVoidFn;
let psg_reset: WasmVoidFn;
let psg_ticks: WasmSet1Fn;
let psg_read: WasmGet1Fn;
let psg_write: WasmSet2Fn;

let ctc_init: WasmVoidFn;
let ctc_reset: WasmVoidFn;
let ctc_ticks: WasmGet1Fn;
let ctc_read: WasmGet1Fn;
let ctc_write: WasmSet2Fn;
let ctc_set_reti: WasmVoidFn;

let get_z80_a: WasmGetFn;
let get_z80_f: WasmGetFn;
let get_z80_l: WasmGetFn;
let get_z80_h: WasmGetFn;
let get_z80_e: WasmGetFn;
let get_z80_d: WasmGetFn;
let get_z80_c: WasmGetFn;
let get_z80_b: WasmGetFn;
let get_z80_fa: WasmGetFn;
let get_z80_af: WasmGetFn;
let get_z80_hl: WasmGetFn;
let get_z80_de: WasmGetFn;
let get_z80_bc: WasmGetFn;
let get_z80_fa_: WasmGetFn;
let get_z80_af_: WasmGetFn;
let get_z80_hl_: WasmGetFn;
let get_z80_de_: WasmGetFn;
let get_z80_bc_: WasmGetFn;
let get_z80_sp: WasmGetFn;
let get_z80_iy: WasmGetFn;
let get_z80_ix: WasmGetFn;
let get_z80_wz: WasmGetFn;
let get_z80_pc: WasmGetFn;
let get_z80_ir: WasmGetFn;
let get_z80_i: WasmGetFn;
let get_z80_r: WasmGetFn;
let get_z80_im: WasmGetFn;
let get_z80_iff1: WasmGetFn;
let get_z80_iff2: WasmGetFn;
let get_z80_ei_pending: WasmGetFn;
let set_z80_a: WasmSet1Fn;
let set_z80_f: WasmSet1Fn;
let set_z80_l: WasmSet1Fn;
let set_z80_h: WasmSet1Fn;
let set_z80_e: WasmSet1Fn;
let set_z80_d: WasmSet1Fn;
let set_z80_c: WasmSet1Fn;
let set_z80_b: WasmSet1Fn;
let set_z80_af: WasmSet1Fn;
let set_z80_fa: WasmSet1Fn;
let set_z80_hl: WasmSet1Fn;
let set_z80_de: WasmSet1Fn;
let set_z80_bc: WasmSet1Fn;
let set_z80_fa_: WasmSet1Fn;
let set_z80_af_: WasmSet1Fn;
let set_z80_hl_: WasmSet1Fn;
let set_z80_de_: WasmSet1Fn;
let set_z80_bc_: WasmSet1Fn;
let set_z80_sp: WasmSet1Fn;
let set_z80_iy: WasmSet1Fn;
let set_z80_ix: WasmSet1Fn;
let set_z80_wz: WasmSet1Fn;
let set_z80_pc: WasmSet1Fn;
let set_z80_ir: WasmSet1Fn;
let set_z80_i: WasmSet1Fn;
let set_z80_r: WasmSet1Fn;
let set_z80_im: WasmSet1Fn;
let set_z80_iff1: WasmSet1Fn;
let set_z80_iff2: WasmSet1Fn;
let set_z80_ei_pending: WasmSet1Fn;

let cpu_init: WasmVoidFn;
let cpu_reset: WasmVoidFn;

let mem_read: WasmGet1Fn;
let mem_write: WasmSet2Fn;
let rom_load: WasmSet2Fn;

let io_read: WasmGet1Fn;
let io_write: WasmSet2Fn;

let lm80c_tick: WasmGetFn;
let lm80c_set_debug: WasmSet1Fn;
let lm80c_init: WasmSet1Fn;
let lm80c_reset: WasmVoidFn;
let lm80c_ticks: WasmGet2Fn;

let keyboard_reset: WasmVoidFn;
let keyboard_press: WasmSet2Fn;
let keyboard_release: WasmSet2Fn;
let keyboard_poll: WasmGet1Fn;

let SIO_receiveChar: WasmSet1Fn;

async function load_wasm(): Promise<void> {

   const module = await import('../emscripten_module');
   const emscripten_module = module.default;

   const instance = (await emscripten_module({
      locateFile: (path: string) => {
         if (path.endsWith('.wasm')) {
            return './emscripten_module.wasm';
         }
         return path;
      }
   })) as EmscriptenInstance;

   // makes C exported functions available as typed wrappers
   test_function = instance.cwrap("test_function");

   psg_init  = instance.cwrap("psg_init");
   psg_reset = instance.cwrap("psg_reset");
   psg_ticks = instance.cwrap("psg_ticks", 'void', ['number']);
   psg_read  = instance.cwrap("psg_read", 'number', ['number']);
   psg_write = instance.cwrap("psg_write", null, ['number', 'number']);

   ctc_init     = instance.cwrap("ctc_init");
   ctc_reset    = instance.cwrap("ctc_reset");
   ctc_ticks    = instance.cwrap("ctc_ticks", 'number', ['number']);
   ctc_read     = instance.cwrap("ctc_read", 'number', ['number']);
   ctc_write    = instance.cwrap("ctc_write", null, ['number', 'number']);
   ctc_set_reti = instance.cwrap("ctc_set_reti");

   get_z80_a          = instance.cwrap("get_z80_a", 'number');
   get_z80_f          = instance.cwrap("get_z80_f", 'number');
   get_z80_l          = instance.cwrap("get_z80_l", 'number');
   get_z80_h          = instance.cwrap("get_z80_h", 'number');
   get_z80_e          = instance.cwrap("get_z80_e", 'number');
   get_z80_d          = instance.cwrap("get_z80_d", 'number');
   get_z80_c          = instance.cwrap("get_z80_c", 'number');
   get_z80_b          = instance.cwrap("get_z80_b", 'number');
   get_z80_fa         = instance.cwrap("get_z80_fa", 'number');
   get_z80_af         = instance.cwrap("get_z80_af", 'number');
   get_z80_hl         = instance.cwrap("get_z80_hl", 'number');
   get_z80_de         = instance.cwrap("get_z80_de", 'number');
   get_z80_bc         = instance.cwrap("get_z80_bc", 'number');
   get_z80_fa_        = instance.cwrap("get_z80_fa_", 'number');
   get_z80_af_        = instance.cwrap("get_z80_af_", 'number');
   get_z80_hl_        = instance.cwrap("get_z80_hl_", 'number');
   get_z80_de_        = instance.cwrap("get_z80_de_", 'number');
   get_z80_bc_        = instance.cwrap("get_z80_bc_", 'number');
   get_z80_sp         = instance.cwrap("get_z80_sp", 'number');
   get_z80_iy         = instance.cwrap("get_z80_iy", 'number');
   get_z80_ix         = instance.cwrap("get_z80_ix", 'number');
   get_z80_wz         = instance.cwrap("get_z80_wz", 'number');
   get_z80_pc         = instance.cwrap("get_z80_pc", 'number');
   get_z80_ir         = instance.cwrap("get_z80_ir", 'number');
   get_z80_i          = instance.cwrap("get_z80_i", 'number');
   get_z80_r          = instance.cwrap("get_z80_r", 'number');
   get_z80_im         = instance.cwrap("get_z80_im", 'number');
   get_z80_iff1       = instance.cwrap("get_z80_iff1", 'number');
   get_z80_iff2       = instance.cwrap("get_z80_iff2", 'number');
   get_z80_ei_pending = instance.cwrap("get_z80_ei_pending", 'number');
   set_z80_a          = instance.cwrap("set_z80_a", null, ['number']);
   set_z80_f          = instance.cwrap("set_z80_f", null, ['number']);
   set_z80_l          = instance.cwrap("set_z80_l", null, ['number']);
   set_z80_h          = instance.cwrap("set_z80_h", null, ['number']);
   set_z80_e          = instance.cwrap("set_z80_e", null, ['number']);
   set_z80_d          = instance.cwrap("set_z80_d", null, ['number']);
   set_z80_c          = instance.cwrap("set_z80_c", null, ['number']);
   set_z80_b          = instance.cwrap("set_z80_b", null, ['number']);
   set_z80_af         = instance.cwrap("set_z80_af", null, ['number']);
   set_z80_fa         = instance.cwrap("set_z80_fa", null, ['number']);
   set_z80_hl         = instance.cwrap("set_z80_hl", null, ['number']);
   set_z80_de         = instance.cwrap("set_z80_de", null, ['number']);
   set_z80_bc         = instance.cwrap("set_z80_bc", null, ['number']);
   set_z80_fa_        = instance.cwrap("set_z80_fa_", null, ['number']);
   set_z80_af_        = instance.cwrap("set_z80_af_", null, ['number']);
   set_z80_hl_        = instance.cwrap("set_z80_hl_", null, ['number']);
   set_z80_de_        = instance.cwrap("set_z80_de_", null, ['number']);
   set_z80_bc_        = instance.cwrap("set_z80_bc_", null, ['number']);
   set_z80_sp         = instance.cwrap("set_z80_sp", null, ['number']);
   set_z80_iy         = instance.cwrap("set_z80_iy", null, ['number']);
   set_z80_ix         = instance.cwrap("set_z80_ix", null, ['number']);
   set_z80_wz         = instance.cwrap("set_z80_wz", null, ['number']);
   set_z80_pc         = instance.cwrap("set_z80_pc", null, ['number']);
   set_z80_ir         = instance.cwrap("set_z80_ir", null, ['number']);
   set_z80_i          = instance.cwrap("set_z80_i", null, ['number']);
   set_z80_r          = instance.cwrap("set_z80_r", null, ['number']);
   set_z80_im         = instance.cwrap("set_z80_im", null, ['number']);
   set_z80_iff1       = instance.cwrap("set_z80_iff1", null, ['number']);
   set_z80_iff2       = instance.cwrap("set_z80_iff2", null, ['number']);
   set_z80_ei_pending = instance.cwrap("set_z80_ei_pending", null, ['number']);

   cpu_init            = instance.cwrap("cpu_init", null);
   cpu_reset           = instance.cwrap("cpu_reset", null);

   mem_read           = instance.cwrap("mem_read", 'number', ['number']);
   mem_write          = instance.cwrap("mem_write", null, ['number', 'number']);
   rom_load           = instance.cwrap("rom_load", null, ['number', 'number']);

   io_read            = instance.cwrap("io_read", 'number', ['number']);
   io_write           = instance.cwrap("io_write", null, ['number', 'number']);

   lm80c_tick         = instance.cwrap("lm80c_tick", 'number');
   lm80c_set_debug    = instance.cwrap("lm80c_set_debug", null, ['number']);
   lm80c_init         = instance.cwrap("lm80c_init", null, ['number']);
   lm80c_reset        = instance.cwrap("lm80c_reset", null);
   lm80c_ticks        = instance.cwrap("lm80c_ticks", 'number', ['number', 'number']);

   keyboard_reset     = instance.cwrap("keyboard_reset"  , null );
   keyboard_press     = instance.cwrap("keyboard_press"  , null, ['number', 'number'] );
   keyboard_release   = instance.cwrap("keyboard_release", null, ['number', 'number'] );
   keyboard_poll      = instance.cwrap("keyboard_poll"   , 'number', ['number'] );

   SIO_receiveChar    = instance.cwrap("SIO_receiveChar"   , null, ['number'] );

   // expose instance globally for developer console debugging
   (window as any).wasm_instance = instance;
   wasm_instance = instance;
}

export {
   wasm_instance,
   test_function,
   psg_init,
   psg_reset,
   psg_ticks,
   psg_read,
   psg_write,
   ctc_init,
   ctc_reset,
   ctc_ticks,
   ctc_read,
   ctc_write,
   ctc_set_reti,
   get_z80_a,
   get_z80_f,
   get_z80_l,
   get_z80_h,
   get_z80_e,
   get_z80_d,
   get_z80_c,
   get_z80_b,
   get_z80_fa,
   get_z80_af,
   get_z80_hl,
   get_z80_de,
   get_z80_bc,
   get_z80_fa_,
   get_z80_af_,
   get_z80_hl_,
   get_z80_de_,
   get_z80_bc_,
   get_z80_sp,
   get_z80_iy,
   get_z80_ix,
   get_z80_wz,
   get_z80_pc,
   get_z80_ir,
   get_z80_i,
   get_z80_r,
   get_z80_im,
   get_z80_iff1,
   get_z80_iff2,
   get_z80_ei_pending,
   set_z80_a,
   set_z80_f,
   set_z80_l,
   set_z80_h,
   set_z80_e,
   set_z80_d,
   set_z80_c,
   set_z80_b,
   set_z80_af,
   set_z80_fa,
   set_z80_hl,
   set_z80_de,
   set_z80_bc,
   set_z80_fa_,
   set_z80_af_,
   set_z80_hl_,
   set_z80_de_,
   set_z80_bc_,
   set_z80_sp,
   set_z80_iy,
   set_z80_ix,
   set_z80_wz,
   set_z80_pc,
   set_z80_ir,
   set_z80_i,
   set_z80_r,
   set_z80_im,
   set_z80_iff1,
   set_z80_iff2,
   set_z80_ei_pending,
   cpu_init,
   cpu_reset,
   mem_read,
   mem_write,
   rom_load,
   io_read,
   io_write,
   lm80c_tick,
   lm80c_set_debug,
   lm80c_init,
   lm80c_reset,
   lm80c_ticks,
   keyboard_reset,
   keyboard_press,
   keyboard_release,
   keyboard_poll,
   SIO_receiveChar,
   load_wasm
};
