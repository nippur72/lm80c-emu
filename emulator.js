"use strict";

// TODO check actual timings (elapsed)
// TODO list of 8 bit fonts? COLECO, MSX, APPLE/LASER, TOPAZ, AMSTRAD, CGA, PET/VIC, C64
// TODO rename paste into serial
// TODO serial output buffer for printing
// TODO investigate why dropping "screen2_putc.prg" hangs it
// TODO check cpu speed, is it too fast?
// TODO implement SIO-CTC-PIO daisy chain
// TODO fix autoload
// TODO tms timings check 30 T states

// firmware 3.11
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

         //if(sample !== 0) console.log("hhh");
         //writeAudioSamples(elapsed, sample);

         //cloadAudioSamples(elapsed);
         //if(csaving) csaveAudioSamples(elapsed);

         if(ctc_ticks(elapsed)) {            
            let vector = ctc_int_ack();
            cpu.interrupt(false, vector);            
         }

         // psg_ticks(elapsed);

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

// ********************************* AY-3-8910 AUDIO BUFFER ******************************************

let audio_buffers_queue = [];

// FORMULA: one buffer arrives every t cpu cycles 
// t = (3686400 / 2) / (48000 / BUFFER_SIZE)

let last_arrived = 0;
let last_arrived_msec = 0;
let arrived_msec_avg = 0;

function ay38910_audio_buf_ready(ptr, size) {   
   if(!audio_playing) return;

   //console.log(`buf ready ptr=${ptr} size=${size}`);
   let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPF32.subarray(start,start+size);
   let elapsed = total_cycles - last_arrived;
   last_arrived = total_cycles;   

   let now = (new Date()).valueOf();
   let elapsed_msec = now - last_arrived_msec;
   if(elapsed_msec > 10000) elapsed_msec = 0;
   arrived_msec_avg = (arrived_msec_avg * 0.99) + (elapsed_msec * 0.01);
   last_arrived_msec = now;   
   //console.log(`${elapsed} ${elapsed_msec} ${arrived_msec_avg} processed: ${audio_buffers_queue.length}`);

   //console.log(`${elapsed} arrived: ${audio_buffers_queue.length}`);
   audio_buffers_queue.push(buffer);

   for(let i=0; i<buffer.length; i++) {   
      if(csaveBuffer !== undefined) {
         csaveBuffer[csavePtr++] = buffer[i];
      }         
   }
}

// ********************************* CPU TO AUDIO BUFFER *********************************************

const audioBufferSize = 4096; // enough to hold more than one frame time
const audioBuffer = new Float32Array(audioBufferSize);

let audioPtr = 0;                // points to the write position in the audio buffer (modulus)
let audioPtr_unclipped = 0;      // audio buffer writing absolute counter 
let downSampleCounter = 0;       // counter used to downsample from CPU speed to 48 Khz

function writeAudioSamples(n, s) {
   downSampleCounter += (n * sampleRate);
   if(downSampleCounter >= cpuSpeed) {
      //let s = (speaker_A ? -0.5 : 0.0);
      //if(tape_monitor) s += (cassette_bit_out ? 0.5 : 0.0) + (cassette_bit_in ? 0.0 : 0.5);
      downSampleCounter -= cpuSpeed;
      audioBuffer[audioPtr++] = s;
      audioPtr = audioPtr % audioBufferSize;
      audioPtr_unclipped++;
   }      
}

// ********************************* AUDIO BUFFER TO BROWSER AUDIO ************************************

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
const bufferSize = 4096;
const sampleRate = audioContext.sampleRate;
var speakerSound = audioContext.createScriptProcessor(bufferSize, 1, 1);

let audioPlayPtr = 0;
let audioPlayPtr_unclipped = 0;

let last_browser_call = 0;
let last_browser_call_msec = 0;
let elapsed_msec_avg = 0;


speakerSound.onaudioprocess = function(e) {
   return;

   const output = e.outputBuffer.getChannelData(0);

   /*
   if(audio_buffers_queue.length === 0) {
      console.log("warning: audio queue is empty");
      for(let i=0; i<bufferSize; i++) {         
         output[i] = audioBuffer[i];
         if(csaveBuffer !== undefined)
            csaveBuffer[csavePtr++] = audioBuffer[i];
       }
      return;
   }
   else if(audio_buffers_queue.length > 5) {
      console.log(`warning: audio queue is getting longer: ${audio_buffers_queue.length}`);
   }
   */

   const buffer = audio_buffers_queue[0];
   //console.log(`before: ${audio_buffers_queue.length}`);
   audio_buffers_queue = audio_buffers_queue.slice(1);
   //console.log(`after: ${audio_buffers_queue.length}`);
   //console.log("");
   //console.log(`${total_cycles} process: ${audio_buffers_queue.length}`);

   let elapsed = total_cycles - last_browser_call;
   last_browser_call = total_cycles;

   let now = (new Date()).valueOf();
   let elapsed_msec = now - last_browser_call_msec;
   if(elapsed_msec > 10000) elapsed_msec = 0;
   elapsed_msec_avg = (elapsed_msec_avg * 0.99) + (elapsed_msec * 0.01);
   last_browser_call_msec = now;   
   //console.log(`${elapsed_msec} ${elapsed_msec_avg} processed: ${audio_buffers_queue.length}`);
   //console.log(e.playbackTime);

   // playback what is in the audio buffer
   for(let i=0; i<bufferSize; i++) {   
      output[i] = buffer[i];       
      /*
      if(csaveBuffer !== undefined)
         csaveBuffer[csavePtr++] = buffer[i];
      */
    }
}

/*
speakerSound.onaudioprocessx = function(e) {
   const output = e.outputBuffer.getChannelData(0);

   // playback gone too far, wait   
   if(audioPlayPtr_unclipped + bufferSize > audioPtr_unclipped ) {
      for(let i=0; i<bufferSize; i++) output[i];
      return;
   }
  
   // playback what is in the audio buffer
   for(let i=0; i<bufferSize; i++) {
      const audio = audioBuffer[audioPlayPtr++];
      audioPlayPtr = audioPlayPtr % audioBufferSize;
      audioPlayPtr_unclipped++;
      output[i] = audio;
    }    
    
    // write pointer should be always ahead of reading pointer
    // if(kk++%50==0) console.log(`write: ${audioPtr_unclipped} read: ${audioPlayPtr_unclipped} diff: ${audioPtr_unclipped-audioPlayPtr_unclipped}`);
}
*/

let audio_playing = false;

function goAudio() {
   audioPlayPtr_unclipped = 0;
   audioPlayPtr = 0;

   audioPtr = 0;
   audioPtr_unclipped = 0;

   speakerSound.connect(audioContext.destination);
   audio_playing = true;
}

function stopAudio() {
   speakerSound.disconnect(audioContext.destination);
   audio_playing = false;
}

function audioContextResume() {   
   if(audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
         console.log('sound playback resumed successfully');
      });
   }
}

goAudio();

/*********************************************************************************** */

let tapeSampleRate = 0;
let tapeBuffer = new Float32Array(0);
let tapeLen = 0;
let tapePtr = 0;
let tapeHighPtr = 0;

function cloadAudioSamples(n) {
   if(tapePtr >= tapeLen) {
      cassette_bit_in = 1;
      return;
   }

   tapeHighPtr += (n*tapeSampleRate);
   if(tapeHighPtr >= cpuSpeed) {
      tapeHighPtr-=cpuSpeed;
      cassette_bit_in = tapeBuffer[tapePtr] > 0 ? 1 : 0;
      tapePtr++;      
   }
}

// ********************************* CPU TO CSAVE BUFFER *********************************************

const csaveBufferSize = 44100 * 5 * 60; // five minutes max

let csaveBuffer;                 // holds the tape audio for generating the WAV file
let csavePtr;                    // points to the write position in the csaveo buffer 
let csaveDownSampleCounter;      // counter used to downsample from CPU speed to 48 Khz

let csaving = false;

function csaveAudioSamples(n) {
   /*
   csaveDownSampleCounter += (n * 44100);
   if(csaveDownSampleCounter >= cpuSpeed) {
      const s = (cassette_bit_out ? 0.75 : -0.75);
      csaveDownSampleCounter -= cpuSpeed;
      csaveBuffer[csavePtr++] = s;
   }
   */
}

function csave() {
   csavePtr = 0;
   csaveDownSampleCounter = 0;
   csaveBuffer = new Float32Array(csaveBufferSize);
   csaving = true;
   console.log("saving audio (max 5 minutes); use cstop() to stop recording");
}

function cstop() {
   csaving = false;

   // trim silence before and after
   //const start = csaveBuffer.indexOf(0.75);
   //const end = csaveBuffer.lastIndexOf(0.75);
   const start = 1;
   const end = csaveBuffer.length;

   const audio = csaveBuffer.slice(start, end);
   const length = Math.round(audio.length / 44100);
   
   const wavData = {
      sampleRate: 44100,
      channelData: [ audio ]
   };
     
   const buffer = encodeSync(wavData, { bitDepth: 16, float: false });      
   
   let blob = new Blob([buffer], {type: "application/octet-stream"});   
   const fileName = "csaved.wav";
   saveAs(blob, fileName);
   console.log(`downloaded "${fileName}" (${length} seconds of audio)`);
}

/*********************************************************************************** */

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