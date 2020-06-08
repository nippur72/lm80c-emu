const fs = require('fs');

function hex(value) {
   return "0x" + (value<=0xF ? "0":"") + value.toString(16);
}

function makeFile(filename, varname) {

   const buffer = fs.readFileSync(filename);

   let s = `// '${filename}' \r\n\r\n`;

   s += `const ${varname} = new Uint8Array([\n   `;

   for(let i=0; i<buffer.length; i++)
   {
      let value = i < buffer.length ? buffer[i] : 0xFF;
      const comma = (i != 32768-1) ? ',':'';
      const cr = (i % 16 == 15) ? '\n   ' : '';
      s += `${hex(value)}${comma}${cr}`;
   }

   s+="]);";

   console.log(s);
}

makeFile("LM80C-firmware-r3131.rom", "rom");

//makeFile("Topaz_a500_v1.0.raw", "topaz");
//makeFile("charset_laser500.rom", "charset_laser500");


