/**** utility functions ****/

function dumpMem(start, end, rows) {
   if(rows==undefined) rows=16;
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

function hexDump(memory, start, end, rows) {
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

function hex(value, size) {
   if(size === undefined) size = 2;
   let s = "0000" + value.toString(16);
   return s.substr(s.length - size);
}

function bin(value, size) {
   if(size === undefined) size = 8;
   let s = "0000000000000000" + value.toString(2);
   return s.substr(s.length - size);
}

function cpu_status() {
   const state = cpu.getState();
   return `A=${hex(state.a)} BC=${hex(state.b)}${hex(state.c)} DE=${hex(state.d)}${hex(state.e)} HL=${hex(state.h)}${hex(state.l)} IX=${hex(state.ix,4)} IY=${hex(state.iy,4)} SP=${hex(state.sp,4)} PC=${hex(state.pc,4)} S=${state.flags.S}, Z=${state.flags.Z}, Y=${state.flags.Y}, H=${state.flags.H}, X=${state.flags.X}, P=${state.flags.P}, N=${state.flags.N}, C=${state.flags.C}`;   
}

function mem_write_word(address, word) {
   mem_write(address + 0, word & 0xFF);
   mem_write(address + 1, (word & 0xFF00) >> 8);
}

function mem_read_word(address) {
   const lo = mem_read(address + 0);
   const hi = mem_read(address + 1);
   return lo+hi*256;
}

function crun(filename) {
   load(filename);
   //await print_string("\nrun:\n");
   pasteLine("RUN\r\n");
}

function paste(text) {
   const lines = text.split("\n");
   for(let t=0; t<lines.length; t++) {
      const linea = lines[t];
      console.log(linea);
      pasteLine(linea);
      pasteChar(13);   // CR
   }
   console.log("pasted!");
}

function pasteLine(line) {
   for(let t=0;t<line.length;t++) {
      let c = line.charCodeAt(t);
      pasteChar(c);
   }
}

let CTC_enabled = true;

function pasteChar(c) {
   CTC_enabled = false;
   sio.receiveChar(c);
   renderLines(262*4);
   CTC_enabled = true;
}

function wait(time) {
   return new Promise((resolve,reject)=>{
      setTimeout(()=>{
         resolve();
      }, time);
   });
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

function stop() {   
   stopped = true;
   console.log("emulation stopped");
}

function go() {
   stopped = false;
   oneFrame();
   console.log("emulation resumed");
}

function info() { 
   const average = averageFrameTime; /* oneFrameTimeSum/frames; */
   console.log(`frame rendering: min ${Math.round(minFrameTime*10,2)/10} ms (load=${Math.round(minFrameTime/frameDuration*100*10,2)/10} %) average ${Math.round(average*10,2)/10} ms (${Math.round(average/frameDuration*100*10,2)/10} %)`);   
}

function set_bit(value, bitn) {
   return value | (1<<bitn);
}

function reset_bit(value, bitn) {
   return value & ~(1<<bitn);
}

function set(value, bitmask) {
   return value | bitmask; 
}

function reset(value, bitmask) {
   return value & (0xFF ^ bitmask);
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
      s = JSON.parse(s);            
      copyArray( s.ram, ram);
      cpu.setState(s.cpu);
   }
   catch(error)
   {

   }
}

function dumpPointers() {
   console.log(`
   +------------------------+ <- VARTAB (0x${hex(VARTAB,4)}) ${hex(mem_read_word(VARTAB),4)}
   |     BASIC program      |
   +------------------------+ <- TXTTAB (0x${hex(TEXT,4)}) ${hex(mem_read_word(TEXT),4)}
   |    System variables    |
   +------------------------+ 0x8000
`);
}

let debugBefore = undefined;
let debugAfter = undefined;

function bit(b,n) {
   return (b & (1<<n))>0 ? 1 : 0;
} 

function not_bit(b,n) {
   return (b & (1<<n))>0 ? 0 : 1;
} 

function dumpStack() {
   const sp = cpu.getState().sp;

   for(let t=sp;t<=0xffff;t+=2) {
      const word = mem_read_word(t);
      console.log(`${hex(t,4)}: ${hex(word,4)}  (${word})`);
   }
}

function endsWith(s, value) {
   return s.substr(-value.length) === value;
}

function copyArray(source, dest) {
   source.forEach((e,i)=>dest[i] = e);
}