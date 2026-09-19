// mk_cfcard_gzip.js
//
// Compresses software/cfcard.img into software/cfcard.img.gz, the image the emulator mounts
// by default. The browser inflates it on the fly with DecompressionStream, so the raw
// 250 MB image stays out of the repository.
//
// Build a new card with File -> Save CF card... in the emulator, then run this script.
//
// Usage:  node mk_cfcard_gzip.js     (or: npm run packcfcard)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const input = path.join(__dirname, 'software', 'cfcard.img');
const output = path.join(__dirname, 'software', 'cfcard.img.gz');

if(!fs.existsSync(input)) {
   console.error(`error: ${input} not found, cannot build ${output}`);
   process.exit(1);
}

fs.createReadStream(input)
   .pipe(zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }))
   .pipe(fs.createWriteStream(output))
   .on('finish', () => {
      const before = fs.statSync(input).size;
      const after = fs.statSync(output).size;
      console.log(`${output}: ${before} -> ${after} bytes (${(after / before * 100).toFixed(1)}%)`);
   });
