const fs = require('fs');

function hex(value) {
   return "0x" + (value<=0xF ? "0":"") + value.toString(16);
}

function makeEprom() {

   const file_name = "LM80C-firmware-r310.rom";

   const eprom = fs.readFileSync(file_name);

   let s = `// '${file_name}' 32K EPROM\r\n\r\n`;
   
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

