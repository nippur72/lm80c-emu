"use strict";

// TODO persisent CF card
// TODO emulate second VRAM bank
// TODO allow phisical keyboard
// TODO drop bomb sound for "air attack" differs from FPGA
// TODO check again NMI interrupt, behaves differently than fpga
// TODO fix autoload
// TODO stereo audio: A right, B left, C common
// TODO keyboard buffering
// TODO check actual timings (elapsed)
// TODO check cpu speed, is it too fast?
// TODO rename paste into serial
// TODO serial output buffer for printing
// TODO investigate why dropping "screen2_putc.prg" hangs it
// TODO implement SIO-CTC-PIO daisy chain
// TODO tms timings check 30 T states
// TODO mobile keyboard
// TODO save WAV files of AY38910
// TODO pseudo VZ files with version


// firmware 3.14
let LM80C_model = 0;         // 0=LM80C 32K, 1=64K
let BASTXT      = 0x8133;    // points to basic free area (start of program)
let PROGND      = 0x81BB;    // points to end of the basic program
let CRSR_STATE  = 0x81E9;    // cursor visibility state (for injecting keys)

let cpu;

/******************/

const cpuSpeed = 3686400;    // 7372800/2 number given by @leomil72
const vdcSpeed = 10738635;   // number given by @leomil72
const frameRate = vdcSpeed/(342*262*2);   // ~60 Hz
const frameDuration = 1000/frameRate;     // duration of 1 frame in msec
const cyclesPerLine = cpuSpeed / vdcSpeed * 342;

let stopped = false; // allows to stop/resume the emulation

let frames = 0;
let averageFrameTime = 0;

let cycle = 0;
let total_cycles = 0;

let options = {
   load: undefined,
   restore: false
};

let audio = new Audio(4096);

let storage = new BrowserStorage("lm80c");

function renderFrame() {
   total_cycles += lm80c_ticks(262 * 2 * cyclesPerLine);
}

function poll_keyboard() {
   if(keyboard_buffer.length > 0) {
      let key_event = keyboard_buffer[0];
      keyboard_buffer = keyboard_buffer.slice(1);

      keyboardReset();
      if(key_event.type === "press") {
         key_event.hardware_keys.forEach((k) => keyPress(k));
      }
   }
}

let end_of_frame_hook = undefined;

let last_timestamp = 0;
function oneFrame(timestamp) {
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
      let firmware;
      if(options.rom == undefined) options.rom = "64K112";
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
      if(options.rom == "64K102") { firmware = rom_64K_102; BASTXT=0x5233; PROGND=0x5322; CRSR_STATE=0x52D8; LM80C_model=1; }
      if(options.rom == "64K103") { firmware = rom_64K_103; BASTXT=0x5224; PROGND=0x5313; CRSR_STATE=0x52C7; LM80C_model=1; }
      if(options.rom == "64K104") { firmware = rom_64K_104; BASTXT=0x5254; PROGND=0x5343; CRSR_STATE=0x52F7; LM80C_model=1; }
      if(options.rom == "64K105") { firmware = rom_64K_105; BASTXT=0x527A; PROGND=0x5368; CRSR_STATE=0x531C; LM80C_model=1; }
      if(options.rom == "64K111") { firmware = rom_64K_111; BASTXT=0x604E; PROGND=0x6164; CRSR_STATE=0x6118; LM80C_model=1; }
      if(options.rom == "64K112") { firmware = rom_64K_112; BASTXT=0x608E; PROGND=0x61A4; CRSR_STATE=0x6158; LM80C_model=1; }
      firmware.forEach((v,i)=>rom_load(i,v));
   }

   cpu =
   {
      init: cpu_init,
      reset: cpu_reset,
      getState: ()=>{
         return {
            pc: get_z80_pc()
         }
      }
   };

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

   // rom autoload
   if(autoload !== undefined) {
      autoload.forEach((e,i)=>rom_load(i,e));
   }

   // starts drawing frames
   oneFrame();

   // autoload program and run it
   if(autoload !== undefined) {
      throw "not implemented";
   }
}

function cpu_actual_speed() {
   return (total_cycles / (new Date().valueOf() - cpu_started_msec)) * 1000;
}

// connect the SIO output to the printer
function sio_write_data(port, data) {
   printerWrite(data);
   //send_byte_to_modem(data);
}
function sio_write_control(port, data) {
   //console.log(`Serial port ${port} register write ${hex(data)}`);
}

// FORMULA: one buffer arrives every t cpu cycles
// T = (3686400 / 2) / (48000 / BUFFER_SIZE)
// in msec: t = BUFFER_SIZE / 48000 = 85.3

function ay38910_audio_buf_ready(ptr, size) {
   if(!audio.playing) return;
   let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPF32.subarray(start,start+size);
   audio.playBuffer(buffer);
}

//bbs();

