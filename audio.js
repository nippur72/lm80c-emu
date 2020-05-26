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
}

// ********************************* AUDIO BUFFER TO BROWSER AUDIO ************************************

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
const bufferSize = 4096;
const sampleRate = audioContext.sampleRate;
var speakerSound = audioContext.createScriptProcessor(bufferSize, 1, 1);

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



