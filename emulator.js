"use strict";

// TODO rename to gh-pages
// TODO fix cpu speed
// TODO implement CTC interrupt
// TODO fix autoload

// 32K ROM is defined in roms.js
const ram = new Uint8Array(32768).fill(0x00); 

// these for future extensions
let cassette_bit_in; 
let cassette_bit_out; 
let speaker_A = 0;
let speaker_B = 0;
let caps_lock_bit = 0;

let tape_monitor = true;

let cpu = new Z80({ mem_read, mem_write, io_read, io_write });

// TMS 9918
let mycanvas = document.getElementById('canvas');
let mycanvasctx = mycanvas.getContext('2d');
let tms = new tms9918(mycanvasctx);
let psg = new psg8910();

tms.reset();

let sio = new SIO();
 
/******************/

const cpuSpeed = 3686400; 
const vdcSpeed = 10700000;
const frameRate = vdcSpeed/(342*262*2); // ~60 Hz
const frameDuration = 1000/frameRate;   // duration of 1 frame in msec
const cyclesPerLine = 280; 
const HIDDEN_LINES = 0;

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
   notapemonitor: false,
   scanlines: false,
   saturation: 1.0,
   bt: undefined,
   bb: undefined,
   bh: undefined,
   rgbmaskopacity: 0,
   rgbmasksize: 3   
};

let CTC_counter = 0;

// scanline version
function renderLines(nlines, hidden) {
   for(let t=0; t<nlines; t++) {
      // run cpu
      while(true) {         
         if(debugBefore !== undefined) debugBefore();         
         let elapsed = cpu.run_instruction();                  
         if(debugAfter !== undefined) debugAfter(elapsed);
         cycle += elapsed;
         total_cycles += elapsed;
         writeAudioSamples(elapsed);
         cloadAudioSamples(elapsed); 
         if(csaving) csaveAudioSamples(elapsed);       
         
         // CTC emulation TODO improve
         CTC_counter += elapsed;
         if(total_cycles > 10000000) 
         {
            if(CTC_counter > (cpuSpeed / 100)) {
               CTC_counter -= (cpuSpeed / 100);  // 10 msec (100Hz)
               cpu.interrupt(false, 0x16);               
            }            
         }

         if(cycle>=cyclesPerLine) {
            cycle-=cyclesPerLine;
            break;            
         }
      } 

   }
}

function renderAllLines() {   
   // VDP interrupt triggers a NMI
   cpu.interrupt(true, 0x16);      

   renderLines(HIDDEN_SCANLINES_TOP, true);               
   renderLines(SCREEN_H, false);                    
   renderLines(HIDDEN_SCANLINES_BOTTOM, true);       
   
   tms.montaUsandoMemoria();   
}

let nextFrame;
let end_of_frame_hook = undefined;

function oneFrame() {   
   const startTime = new Date().getTime();      

   if(nextFrame === undefined) nextFrame = startTime;

   nextFrame = nextFrame + (1000/frameRate); // ~50Hz  

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

// ********************************* CPU TO AUDIO BUFFER *********************************************

const audioBufferSize = 16384; // enough to hold more than one frame time
const audioBuffer = new Float32Array(audioBufferSize);

let audioPtr = 0;                // points to the write position in the audio buffer (modulus)
let audioPtr_unclipped = 0;      // audio buffer writing absolute counter 
let downSampleCounter = 0;       // counter used to downsample from CPU speed to 48 Khz

function writeAudioSamples(n) {
   downSampleCounter += (n * sampleRate);
   if(downSampleCounter >= cpuSpeed) {
      let s = (speaker_A ? -0.5 : 0.0);
      if(tape_monitor) s += (cassette_bit_out ? 0.5 : 0.0) + (cassette_bit_in ? 0.0 : 0.5);
      downSampleCounter -= cpuSpeed;
      audioBuffer[audioPtr++] = s;
      audioPtr = audioPtr % audioBufferSize;
      audioPtr_unclipped++;
   }      
}

// ********************************* AUDIO BUFFER TO BROWSER AUDIO ************************************

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
const bufferSize = 2048*2;
const sampleRate = audioContext.sampleRate;
var speakerSound = audioContext.createScriptProcessor(bufferSize, 1, 1);

let audioPlayPtr = 0;
let audioPlayPtr_unclipped = 0;

speakerSound.onaudioprocess = function(e) {
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

function goAudio() {
   audioPlayPtr_unclipped = 0;
   audioPlayPtr = 0;

   audioPtr = 0;
   audioPtr_unclipped = 0;

   speakerSound.connect(audioContext.destination);
}

function stopAudio() {
   speakerSound.disconnect(audioContext.destination);
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
   csaveDownSampleCounter += (n * 44100);
   if(csaveDownSampleCounter >= cpuSpeed) {
      const s = (cassette_bit_out ? 0.75 : -0.75);
      csaveDownSampleCounter -= cpuSpeed;
      csaveBuffer[csavePtr++] = s;
   }      
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
   const start = csaveBuffer.indexOf(0.75);
   const end = csaveBuffer.lastIndexOf(0.75);   

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

// prints welcome message on the console
welcome();

parseQueryStringCommands();

cpu.reset();

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

