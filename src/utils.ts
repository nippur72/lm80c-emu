import { hex, copyArray, mem_read_word } from './bytes.js';
import { load } from './files.js';
import { cpu, BASTXT, PROGND, renderFrame } from './emulator.js';
import { mem_read, SIO_receiveChar } from './emscripten_wrapper.js';

// **** machine-specific utility functions ****

function cpu_status(): string {
   const state = cpu.getState();
   return `A=${hex(state.a)} BC=${hex(state.b)}${hex(state.c)} DE=${hex(state.d)}${hex(state.e)} HL=${hex(state.h)}${hex(state.l)} IX=${hex(state.ix,4)} IY=${hex(state.iy,4)} SP=${hex(state.sp,4)} PC=${hex(state.pc,4)} S=${state.flags.S}, Z=${state.flags.Z}, Y=${state.flags.Y}, H=${state.flags.H}, X=${state.flags.X}, P=${state.flags.P}, N=${state.flags.N}, C=${state.flags.C}`;   
}

async function crun(filename: string): Promise<void> {
   await load(filename);
   //await print_string("\nrun:\n");
   pasteLine("RUN\r\n");
}

function paste(text: string): void {
   const lines = text.split("\n");
   for(let t=0; t<lines.length; t++) {
      const linea = lines[t];
      console.log(linea);
      pasteLine(linea);
      pasteChar(13);   // CR
   }
}

function pasteLine(line: string): void {
   renderFrame();

   for(let t=0;t<line.length;t++) {
      let c = line.charCodeAt(t);
      pasteChar(c);
   }
}

function pasteChar(c: number): void {
   SIO_receiveChar(c);
}

function zap() {            
   ram.forEach((e,i)=>ram[i]=0x00);
   let state = cpu.getState();
   state.halted = true;
   cpu.setState(state);
}

function power() {      
   zap();
   setTimeout(()=>cpu.reset(), 200);
}

function saveState() {
   const saveObject = {
      ram: Array.from(ram),
      cpu: cpu.getState()  
   };   

   window.localStorage.setItem(`lm80c_emu_state`, JSON.stringify(saveObject));
}

function restoreState() {   
   try
   {
      let s = window.localStorage.getItem(`lm80c_emu_state`);
      if(s === null) return;   
      let state = JSON.parse(s);            
      copyArray( state.ram, ram);
      cpu.setState(state.cpu);
   }
   catch(error)
   {

   }
}

function dumpPointers() {
   console.log(`
   +------------------------+ <-  (0x${hex(PROGND,4)}) ${hex(mem_read_word(PROGND),4)}
   |     BASIC program      |
   +------------------------+ <- TXTTAB (0x${hex(BASTXT,4)}) ${hex(mem_read_word(BASTXT),4)}
   |    System variables    |
   +------------------------+ 0x8000
`);
}

let debugBefore: (() => void) | undefined = undefined;
let debugAfter: (() => void) | undefined = undefined;

function dumpStack(): void {
   const sp = cpu.getState().sp;

   for(let t=sp;t<=0xffff;t+=2) {
      const word = mem_read_word(t);
      console.log(`${hex(t,4)}: ${hex(word,4)}  (${word})`);
   }
}

function make_lm(start: number, end: number, rows: number = 8): void {
   let s;
   s = `10 FOR T=&H${hex(start,4)} TO &H${hex(end,4)}\n`;
   s+= `20 READ B:POKE T,B\n`;
   s+= `30 NEXT\n`;
   s+= `40 SYS &H${hex(start,4)}\n`;
   s+= `50 END\n`;
   let nline = 1000;
   for(let r=start;r<=end;r+=rows) {
      s+= `${nline} DATA `;
      for(let c=0;c<rows && (r+c)<=end;c++) {
         const byte = mem_read(r+c);
         s+= `${byte}`;
         if(c!=rows-1 && (r+c)!=end) s+=",";
      }
      s+="\n";
      nline += 10;
   }
   console.log(s);
}

let counter = 0;
let counter_avg = 0;

function start_counter() {
   counter = new Date().valueOf();
}

function stop_counter() {
   let now = new Date().valueOf();
   let cnt = counter;
   if(cnt === 0) cnt = now
   let elapsed = now - cnt;   
   counter_avg = 0.9 * counter_avg + 0.1 * elapsed;
   return counter_avg;
}

let LED = 0;
function led_read() {
   return LED;
}

function led_write(value: number) {
   LED = value;
}

// Attach to window for developer console and WASM visibility
(window as any).cpu_status = cpu_status;
(window as any).crun = crun;
(window as any).paste = paste;
(window as any).zap = zap;
(window as any).power = power;
(window as any).saveState = saveState;
(window as any).restoreState = restoreState;
(window as any).dumpPointers = dumpPointers;
(window as any).dumpStack = dumpStack;
(window as any).make_lm = make_lm;
(window as any).start_counter = start_counter;
(window as any).stop_counter = stop_counter;
(window as any).led_read = led_read;
(window as any).led_write = led_write;

(window as any).debugBefore = debugBefore;
(window as any).debugAfter = debugAfter;

export {
   cpu_status, crun, paste, zap, power, saveState, restoreState,
   dumpPointers, dumpStack, make_lm, start_counter, stop_counter,
   led_read, led_write, debugBefore, debugAfter
};


