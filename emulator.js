"use strict";

// TODO check again NMI interrupt, behaves differently than fpga
// TODO stereo audio: A right, B left, C common
// TODO fix AY-3-8910
// TODO keyboard buffering
// TODO check actual timings (elapsed)
// TODO rename paste into serial
// TODO serial output buffer for printing
// TODO investigate why dropping "screen2_putc.prg" hangs it
// TODO check cpu speed, is it too fast?
// TODO implement SIO-CTC-PIO daisy chain
// TODO fix autoload
// TODO tms timings check 30 T states
// TODO list of 8 bit fonts? COLECO, MSX, APPLE/LASER, TOPAZ, AMSTRAD, CGA, PET/VIC, C64


// firmware 3.13.3
let BASTXT     = 0x8133;
let PROGND     = 0x81BB;
let CRSR_STATE = 0x81E9;
let TMRCNT     = 0x81CE;

// 32K ROM is defined in roms.js
const ram = new Uint8Array(32768).fill(0x00); 

let cpu;

/******************/

const cpuSpeed = 3686400;    // 7372800/2 number given by @leomil72
const vdcSpeed = 10738635;   // number given by @leomil72
const frameRate = vdcSpeed/(342*262*2);   // ~60 Hz
const frameDuration = 1000/frameRate;     // duration of 1 frame in msec
const cyclesPerLine = cpuSpeed / vdcSpeed * 342;

let stopped = false; // allows to stop/resume the emulation

let frames = 0;
let nextFrameTime = 0;
let averageFrameTime = 0;
let minFrameTime = Number.MAX_VALUE;

let cycle = 0;
let total_cycles = 0;

let throttle = false;

let options = {
   load: undefined,
   restore: false
};

// scanline version
function renderLines(nlines) {
   for(let t=0; t<nlines; t++) {
      total_cycles += lm80c_tick_line(cyclesPerLine);
   }
}

function renderAllLines() {

   // poll keyboard
   if(keyboard_buffer.length > 0) {
      let key_event = keyboard_buffer[0];
      keyboard_buffer = keyboard_buffer.slice(1);

      keyboardReset();
      if(key_event.type === "press") {
         key_event.hardware_keys.forEach((k) => keyPress(k));
      }
   }

   renderLines(262);  // frame linee pari
   renderLines(262);  // frame linee dispari
}

/*
function oneFrame() {
   renderAll_2(0);
}

let cpu_timer = 0;
let delta;

function renderAll_2(timer) {

   delta = timer - cpu_timer;
   if(delta > 200) {
      delta = 200;
      cpu_timer = timer;
   }

   let line_time = cyclesPerLine / cpuSpeed * 1000 * 100;
   let n_lines = delta * line_time;


   // poll keyboard
   if(keyboard_buffer.length > 0) {
      let key_event = keyboard_buffer[0];
      keyboard_buffer = keyboard_buffer.slice(1);

      keyboardReset();
      if(key_event.type === "press") {
         key_event.hardware_keys.forEach((k) => keyPress(k));
      }
   }
   renderLines(n_lines);
   //console.log(timer, cpu_timer, delta, n_lines);

   cpu_timer += n_lines * line_time;

   requestAnimationFrame(renderAll_2);
}
*/

let nextFrame;
let end_of_frame_hook = undefined;

function oneFrame() {
   const startTime = new Date().getTime();      

   if(nextFrame === undefined) nextFrame = startTime;

   nextFrame = nextFrame + (1000/frameRate); 

   renderAllLines();
   frames++;   

   if(end_of_frame_hook !== undefined) end_of_frame_hook();

   const now = new Date().getTime();
   const elapsed = now - startTime;
   averageFrameTime = averageFrameTime * 0.992 + elapsed * 0.008;
   if(elapsed < minFrameTime) minFrameTime = elapsed;

   let time_out = nextFrame - now;
   if(time_out < 0 || throttle) {
      time_out = 0;
      nextFrame = undefined;      
   }
   if(!stopped) setTimeout(()=>oneFrame(), time_out);   
}


function main() {
   // prints welcome message on the console
   welcome();

   parseQueryStringCommands();

   // loads the eprom
   rom.forEach((v,i)=>rom_load(i,v));

   cpu =
   {
      init: cpu_init,
      reset: cpu_reset,
      run_instruction: cpu_run_instruction,
      interrupt: cpu_interrupt,
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

   lm80c_init();
   lm80c_reset();

   goAudio();

   // rom autoload
   if(autoload !== undefined) {
      autoload.forEach((e,i)=>rom_load(i,e));
   }

   // starts drawing frames
   oneFrame();

   /*
   // autoload program and run it
   if(autoload !== undefined) {
      //zap();
      //cpu.reset();

      setTimeout(()=>{
         loadBytes(autoload);
         pasteLine("RUN\r\n");
      }, 200);
   }
   */
}

function cpu_actual_speed() {
   return (total_cycles / (new Date().valueOf() - cpu_started_msec)) * 1000;
}
