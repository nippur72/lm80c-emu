class LMAudio {
   AUDIO_BUFSIZE: number;
   playing: boolean;
   buffers: number[][];
   audioContext: AudioContext;
   sampleRate: number;
   speakerSound: ScriptProcessorNode;

   constructor(bufsize: number) {
      this.AUDIO_BUFSIZE = bufsize;  // must match psg.c
      this.playing = false;
      this.buffers = [];
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      this.speakerSound = this.audioContext.createScriptProcessor(this.AUDIO_BUFSIZE, 1, 1);

      this.speakerSound.onaudioprocess = (e) => {
         const output = e.outputBuffer.getChannelData(0);

         if(this.buffers.length === 0) {
            // console.log("warning: audio queue is empty");
            return;
         }
         else if(this.buffers.length > 2) {
            // console.log(`warning: audio queue is getting longer: ${audio_buffers_queue.length}`);
            this.buffers = [];
            return;
         }

         const buffer = this.buffers[0];
         this.buffers = this.buffers.slice(1);

         for(let i=0; i<this.AUDIO_BUFSIZE; i++) {
            output[i] = buffer[i];
         }
      }
   }

   playBuffer(buffer: ArrayLike<number>) {
      if(!this.playing) return;
      this.buffers.push(Array.from(buffer));  // push a cloned copy
   }

   start() {
      this.speakerSound.connect(this.audioContext.destination);
      this.playing = true;
      this.buffers = [];
   }

   stop() {
      this.speakerSound.disconnect(this.audioContext.destination);
      this.playing = false;
   }

   resume() {
      if(this.audioContext.state === 'suspended') {
         this.audioContext.resume().then(() => {
            this.buffers = [];
            // console.log('sound playback resumed successfully');
         });
      }
   }
}

export { LMAudio };
