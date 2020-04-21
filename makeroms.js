const fs = require('fs');

function hex(value) {
   return "0x" + (value<=0xF ? "0":"") + value.toString(16);
}

function makeEprom() {

   const eprom = fs.readFileSync("LM80C-firmware-r36.rom");

   let s = "// LM80C 32K EPROM\r\n\r\n";
   
   s += "const rom = new Uint8Array([\n   ";

   for(let i=0; i<32768;i++)
   {
      let value = i < eprom.length ? eprom[i] : 0xFF;
      const comma = (i != 32768-1) ? ',':'';
      const cr = (i % 16 == 15) ? '\n   ' : '';
      s += `${hex(value)}${comma}${cr}`;   
   }

   s+="]);";

   console.log(s);
}

makeEprom();

