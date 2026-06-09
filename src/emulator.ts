"use strict";

import { LMAudio } from './audio.js';
import { BrowserStorage } from './filesystem.js';
import { BBS } from './bbs.js';
import { keyboardReset, keyPress, keyRelease } from './keys.js';
import { keyboard_buffer } from './keyboard.js';
import { parseQueryStringCommands } from './browser.js';
import { printerWrite } from './printer.js';
import {
   cpu_init, cpu_reset, lm80c_init, lm80c_reset, lm80c_ticks,
   keyboard_reset, psg_init, psg_reset, ctc_init, ctc_reset,
   get_z80_pc, get_z80_a, get_z80_f, get_z80_b, get_z80_c,
   get_z80_d, get_z80_e, get_z80_h, get_z80_l, get_z80_ix,
   get_z80_iy, get_z80_sp, set_z80_a, set_z80_f, set_z80_b,
   set_z80_c, set_z80_d, set_z80_e, set_z80_h, set_z80_l,
   set_z80_ix, set_z80_iy, set_z80_sp, set_z80_pc, rom_load, wasm_instance, load_wasm
} from './emscripten_wrapper.js';
import { CpuController, EmulatorOptions, Z80State } from './types.js';

// firmware 3.14
let LM80C_model = 0;         // 0=LM80C 32K, 1=64K
let BASTXT      = 0x8133;    // points to basic free area (start of program)
let PROGND      = 0x81BB;    // points to end of the basic program
let CRSR_STATE  = 0x81E9;    // cursor visibility state (for injecting keys)

let cpu: CpuController;

/******************/

const cpuSpeed = 3686400;    // 7372800/2 number given by @leomil72
const vdcSpeed = 10738635;   // number given by @leomil72
const frameRate = vdcSpeed/(342*262*2);   // ~60 Hz
const frameDuration = 1000/frameRate;     // duration of 1 frame in msec
const cyclesPerLine = cpuSpeed / vdcSpeed * 342;

let stopped = false; // allows to stop/resume the emulation

let frameCounter = 0;
let averageFrameTime = 0;

let cycle = 0;
let total_cycles = 0;

let options: EmulatorOptions = {
   load: undefined,
   restore: false
};

let audio = new LMAudio(4096);

let storage = new BrowserStorage("lm80c");

function renderFrame() {
   total_cycles += lm80c_ticks(262 * 2 * cyclesPerLine, cyclesPerLine);
}

function poll_keyboard() {
   if(keyboard_buffer.length > 0) {
      let key_event = keyboard_buffer.shift();
      if (key_event) {
         keyboardReset();
         if(key_event.type === "press") {
            key_event.hardware_keys.forEach((k) => keyPress(k));
         }
      }
   }
}

let end_of_frame_hook: (() => void) | undefined = undefined;

let last_timestamp = 0;
function oneFrame(timestamp?: number) {
   let stamp = timestamp == undefined ? last_timestamp : timestamp;
   let msec = stamp - last_timestamp;
   let cycles = cpuSpeed * msec / 1000;
   last_timestamp = stamp;

   if(msec > frameRate*2) cycles = cpuSpeed * (frameRate*2 / 1000);

   poll_keyboard();

   total_cycles += lm80c_ticks(cycles, cyclesPerLine);

   averageFrameTime = averageFrameTime * 0.992 + msec * 0.008;

   if(!stopped) requestAnimationFrame(oneFrame);
}

function main() {

   parseQueryStringCommands();

   // loads the eprom
   {
      let firmware: Uint8Array | undefined;
      if(options.rom == undefined) options.rom = "64K120";
      if(options.rom == "310")    { firmware = rom_310; }
      if(options.rom == "311")    { firmware = rom_311; }
      if(options.rom == "312")    { firmware = rom_312; }
      if(options.rom == "313")    { firmware = rom_313; }
      if(options.rom == "3131")   { firmware = rom_3131; }
      if(options.rom == "3132")   { firmware = rom_3132; }
      if(options.rom == "3133")   { firmware = rom_3133; }
      if(options.rom == "3134")   { firmware = rom_3134; }
      if(options.rom == "3135")   { firmware = rom_3135; }
      if(options.rom == "3136")   { firmware = rom_3136; }
      if(options.rom == "3137")   { firmware = rom_3137; }
      if(options.rom == "3138")   { firmware = rom_3138; }
      if(options.rom == "314")    { firmware = rom_314;     BASTXT=0x8133; PROGND=0x81BB; CRSR_STATE=0x81E9; LM80C_model=0; }
      if(options.rom == "315")    { firmware = rom_315;     BASTXT=0x8133; PROGND=0x81BB; CRSR_STATE=0x81E9; LM80C_model=0; }
      if(options.rom == "316")    { firmware = rom_316;     BASTXT=0x8133; PROGND=0x821E; CRSR_STATE=0x81D6; LM80C_model=0; }
      if(options.rom == "317")    { firmware = rom_317;     BASTXT=0x8135; PROGND=0x8224; CRSR_STATE=0x81D8; LM80C_model=0; }
      if(options.rom == "318")    { firmware = rom_318;     BASTXT=0x8135; PROGND=0x8224; CRSR_STATE=0x81D8; LM80C_model=0; }
      if(options.rom == "319")    { firmware = rom_319;     BASTXT=0x8135; PROGND=0x8223; CRSR_STATE=0x81D7; LM80C_model=0; }
      if(options.rom == "321")    { firmware = rom_321;     BASTXT=0x8135; PROGND=0x824B; CRSR_STATE=0x81FF; LM80C_model=0; }
      if(options.rom == "322")    { firmware = rom_322;     BASTXT=0x8135; PROGND=0x824B; CRSR_STATE=0x81FF; LM80C_model=0; }
      if(options.rom == "323")    { firmware = rom_323;     BASTXT=0x8135; PROGND=0x824C; CRSR_STATE=0x8200; LM80C_model=0; }
      if(options.rom == "324")    { firmware = rom_324;     BASTXT=0x8135; PROGND=0x824C; CRSR_STATE=0x8200; LM80C_model=0; }
      if(options.rom == "64K102") { firmware = rom_64K_102; BASTXT=0x5233; PROGND=0x5322; CRSR_STATE=0x52D8; LM80C_model=1; }
      if(options.rom == "64K103") { firmware = rom_64K_103; BASTXT=0x5224; PROGND=0x5313; CRSR_STATE=0x52C7; LM80C_model=1; }
      if(options.rom == "64K104") { firmware = rom_64K_104; BASTXT=0x5254; PROGND=0x5343; CRSR_STATE=0x52F7; LM80C_model=1; }
      if(options.rom == "64K105") { firmware = rom_64K_105; BASTXT=0x527A; PROGND=0x5368; CRSR_STATE=0x531C; LM80C_model=1; }
      if(options.rom == "64K111") { firmware = rom_64K_111; BASTXT=0x604E; PROGND=0x6164; CRSR_STATE=0x6118; LM80C_model=1; }
      if(options.rom == "64K112") { firmware = rom_64K_112; BASTXT=0x608E; PROGND=0x61A4; CRSR_STATE=0x6158; LM80C_model=1; }
      if(options.rom == "64K113") { firmware = rom_64K_113; BASTXT=0x6096; PROGND=0x61AD; CRSR_STATE=0x6161; LM80C_model=1; }
      if(options.rom == "64K114") { firmware = rom_64K_114; BASTXT=0x60AA; PROGND=0x61C1; CRSR_STATE=0x6175; LM80C_model=1; }
      if(options.rom == "64K115") { firmware = rom_64K_115; BASTXT=0x5473; PROGND=0x5586; CRSR_STATE=0x553A; LM80C_model=1; }
      if(options.rom == "64K116") { firmware = rom_64K_116; BASTXT=0x54AF; PROGND=0x55C2; CRSR_STATE=0x5576; LM80C_model=1; }
      if(options.rom == "64K117") { firmware = rom_64K_117; BASTXT=0x54AF; PROGND=0x55C2; CRSR_STATE=0x5576; LM80C_model=1; }
      if(options.rom == "64K118") { firmware = rom_64K_118; BASTXT=0x54D1; PROGND=0x55E4; CRSR_STATE=0x5598; LM80C_model=1; }
      if(options.rom == "64K119") { firmware = rom_64K_119; BASTXT=0x54D8; PROGND=0x55EB; CRSR_STATE=0x559F; LM80C_model=1; }
      if(options.rom == "64K120") { firmware = rom_64K_120; BASTXT=0x54D8; PROGND=0x55EB; CRSR_STATE=0x559F; LM80C_model=1; }
      if (firmware) {
         firmware.forEach((v,i)=>rom_load(i,v));
      }
   }

   const bit = (val: number, n: number) => (val & (1 << n)) > 0 ? 1 : 0;

   cpu =
   {
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
      setState: (state: Z80State) => {
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

   // attach cpu to window for developer debug visibility
   (window as any).cpu = cpu;

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

   // starts drawing frames
   oneFrame();
}

function cpu_actual_speed() {
   return (total_cycles / (new Date().valueOf() - cpu_started_msec)) * 1000;
}

// FORMULA: one buffer arrives every t cpu cycles
// T = (3686400 / 2) / (48000 / BUFFER_SIZE)
// in msec: t = BUFFER_SIZE / 48000 = 85.3

function ay38910_audio_buf_ready(ptr: number, size: number) {
   if(!audio.playing) return;
   let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPF32.subarray(start,start+size);
   audio.playBuffer(buffer);
}

// connect the SIO output to the printer
let sio_write_data = function(port: number, data: number) {
   printerWrite(data);
};
let sio_write_control = function(port: number, data: number) {
};

// Attach functions called by WASM runtime to the window object
(window as any).sio_write_data = sio_write_data;
(window as any).sio_write_control = sio_write_control;
(window as any).ay38910_audio_buf_ready = ay38910_audio_buf_ready;

function setStopped(val: boolean) {
   stopped = val;
}

// Attach main and BBS to window to let index.html and external scripts run them
(window as any).main = main;
(window as any).BBS = BBS;


export {
   cpu,
   stopped,
   setStopped,
   options,
   audio,
   oneFrame,
   averageFrameTime,
   BASTXT,
   PROGND,
   renderFrame,
   storage,
   end_of_frame_hook,
   load_wasm,
   main
};
