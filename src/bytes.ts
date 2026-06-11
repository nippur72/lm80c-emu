import { mem_read, mem_write, wasm_instance } from './emscripten_wrapper';
import { audio, oneFrame, averageFrameTime, setStopped } from './emulator';
import { saveAs } from 'file-saver';

function dumpMem(start: number, end: number, rows: number = 16) {
   let s="\r\n";
   for(let r=start;r<=end;r+=rows) {
      s+= hex(r, 4) + ": ";
      for(let c=0;c<rows && (r+c)<=end;c++) {
         const byte = mem_read(r+c);
         s+= hex(byte)+" ";
      }
      for(let c=0;c<rows && (r+c)<=end;c++) {
         const byte = mem_read(r+c);
         s+= (byte>32 && byte<127) ? String.fromCharCode(byte) : '.' ;
      }
      s+="\n";
   }
   console.log(s);
}

function dumpBytes(bytes: Uint8Array | number[], start: number, end: number, rows: number = 16) {
   let s="\r\n";
   for(let r=start;r<=end;r+=rows) {
      s+= hex(r, 4) + ": ";
      for(let c=0;c<rows && (r+c)<=end;c++) {
         const byte = bytes[r+c];
         s+= hex(byte)+" ";
      }
      for(let c=0;c<rows && (r+c)<=end;c++) {
         const byte = bytes[r+c];
         s+= (byte>32 && byte<127) ? String.fromCharCode(byte) : '.' ;
      }
      s+="\n";
   }
   console.log(s);
}

function downloadBytes(fileName: string, buffer: BlobPart) {
   let blob = new Blob([buffer], {type: "application/octet-stream"});
   saveAs(blob, fileName);
   console.log(`downloaded "${fileName}"`);
}

function hexDump(memory: Uint8Array | number[], start: number, end: number, rows: number = 16): string {
   let s="";
   for(let r=start;r<end;r+=rows) {
      s+= hex(r, 4) + ": ";
      for(let c=0;c<rows;c++) {
         const byte = memory[r+c];
         s+= hex(byte)+" ";
      }
      for(let c=0;c<rows;c++) {
         const byte = memory[r+c];
         s+= (byte>32 && byte<127) ? String.fromCharCode(byte) : '.' ;
      }
      s+="\n";
   }
   return s;
}

function hex(value: number, size: number = 2): string {
   let s = "0000" + value.toString(16);
   return s.substring(s.length - size);
}

function hi(word: number): number {
   return (word >> 8) & 0xFF;
}

function lo(word: number): number {
   return word & 0xFF;
}

function bin(value: number, size: number = 8): string {
   let s = "0000000000000000" + value.toString(2);
   return s.substring(s.length - size);
}

function mem_write_word(address: number, word: number) {
   mem_write(address + 0, lo(word));
   mem_write(address + 1, hi(word));
}

function mem_read_word(address: number): number {
   const lo = mem_read(address + 0);
   const hi = mem_read(address + 1);
   return lo+hi*256;
}

function set_bit(value: number, bitn: number): number {
   return value | (1<<bitn);
}

// bitwise helper functions
function reset_bit(value: number, bitn: number): number {
   return value & ~(1<<bitn);
}

function set(value: number, bitmask: number): number {
   return value | bitmask;
}

function reset(value: number, bitmask: number): number {
   return value & (0xFF ^ bitmask);
}

function bit(b: number, n: number): number {
   return (b & (1<<n))>0 ? 1 : 0;
}

function not_bit(b: number, n: number): number {
   return (b & (1<<n))>0 ? 0 : 1;
}

function stop() {
   audio.stop();
   setStopped(true);
   console.log("emulation stopped");
}

// control functions
function go() {
   setStopped(false);
   oneFrame();
   console.log("emulation resumed");
}

let show_info = false;
function info() {
   show_info = true;
   const average = averageFrameTime;
   console.log(`frame rate: ${Math.round(average*10)/10} ms (${Math.round(1000/average)} Hz) CPU load: ${Math.round(averageLoad*10)/10}`);
}

function endsWith(s: string, value: string): boolean {
   return s.substring(s.length - value.length) === value;
}

function copyArray(source: Uint8Array | number[], dest: Uint8Array | number[] | { [key: number]: number }) {
   source.forEach((e,i)=>dest[i] = e);
}

function wait(time: number): Promise<void> {
   return new Promise<void>((resolve,reject)=>{
      setTimeout(()=>{
         resolve();
      }, time);
   });
}

function getFileExtension(fileName: string): string {
   let s = fileName.toLowerCase().split(".");
   if(s.length == 1) return "";
   return "." + s[s.length-1];
}

function get_wasm_float32_array(ptr: number, size: number): Float32Array {
   let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPF32.subarray(start,start+size);
   return buffer;
}

function get_wasm_uint8_array(ptr: number, size: number): Uint8Array {
   let start = ptr / wasm_instance.HEAPU8.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPU8.subarray(start,start+size);
   return buffer;
}

function stringToUint8(s: string): Uint8Array {
   let b: number[] = [];
   for(let t=0;t<s.length;t++) {
      b.push(s.charCodeAt(t));
   }
   return new Uint8Array(b);
}

function uint8ToString(b: Uint8Array | number[]): string {
   let s = "";
   for(let t=0;t<b.length;t++) {
      s+=String.fromCharCode(b[t]);
   }
   return s;
}

export {
   dumpMem, dumpBytes, downloadBytes, hexDump, hex, hi, lo, bin,
   mem_write_word, mem_read_word, set_bit, reset_bit, set, reset,
   bit, not_bit, stop, go, show_info, info, endsWith, copyArray,
   wait, getFileExtension, get_wasm_float32_array, get_wasm_uint8_array,
   stringToUint8, uint8ToString
};
