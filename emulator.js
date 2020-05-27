"use strict";

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


// firmware 3.12
let BASTXT     = 0x8133;
let PROGND     = 0x81BB;
let CRSR_STATE = 0x81E9;
let TMRCNT     = 0x81CE;

// 32K ROM is defined in roms.js
const ram = new Uint8Array(32768).fill(0x00); 

// these for future extensions
let cassette_bit_in; 
let cassette_bit_out; 
let speaker_A = 0;

let tape_monitor = true;

let cpu = new Z80({ mem_read, mem_write, io_read, io_write });

//let psg = new psg8910();

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
   restore: false,
   notapemonitor: false
};

let sio = new SIO();

sio.IEI_cb = ()=>{ return 1; }
//ctc.IEI_cb = ()=>{ return sio.IEO(); }

let ctc_enabled = true;

// scanline version
function renderLines(nlines) {

   for(let t=0; t<nlines; t++) {
      // run cpu
      while(true) {         
         if(debugBefore !== undefined) debugBefore();

         // detects the RETI instruction for interrupt acknowledgment
         if(mem_read_word(cpu.getState().pc) === 0x4ded ) {
            sio.cpu_found_RETI();
            ctc_set_reti();
         }
         
         let elapsed = cpu.run_instruction();                  
         if(debugAfter !== undefined) debugAfter(elapsed);
         cycle += elapsed;         
         total_cycles += elapsed;

         if(ctc_enabled)
         {
            if(ctc_ticks(elapsed)) {
               let vector = ctc_int_ack();
               cpu.interrupt(false, vector);
            }
         }

         psg_ticks(elapsed);

         if(cycle>=cyclesPerLine) {
            cycle-=cyclesPerLine;
            break;            
         }
      }

      tms9928a.drawline();

      if(VDP_triggered_NMI) {
         cpu.interrupt(true);
         VDP_triggered_NMI = false;
      }
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
   tms9928a_update(tms9928a.m_tmpbmp);
}

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

   cpu.reset();
   tms9928a.reset();

   psg_init();
   psg_reset();

   ctc_init();
   ctc_reset();

   goAudio();

   // starts drawing frames
   oneFrame();

   // autoload program and run it
   if(autoload !== undefined) {
      //zap();
      //cpu.reset();

      setTimeout(()=>{
         loadBytes(autoload);
         pasteLine("RUN\r\n");
      }, 200);
   }
}

function cpu_actual_speed() {
   return (total_cycles / (new Date().valueOf() - cpu_started_msec)) * 1000;
}