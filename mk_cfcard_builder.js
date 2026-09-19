// mk_cfcard_builder.js
//
// Builds the serial stream used to create an LM80C CF card holding all the BASIC
// programs in software/cf_card_content. The stream first opens the serial line
// (SERIAL1,38400), then for every .BAS file it clears memory with NEW, types the listing
// and saves it on the card with SAVE "<name>".
//
// Usage:  node mk_cfcard_builder.js > cfcard.txt
//
// The output goes to stdout and is meant to be fed to the emulator, either pasted as a
// file (Keyboard -> Paste file...) or piped straight into the serial line. In the saved
// name the .bas extension is dropped and every "_" is replaced by "-".

const fs = require('fs');
const path = require('path');

const CR = '\r';

const folder = path.join(__dirname, 'software', 'cf_card_content');

const files = fs.readdirSync(folder)
   .filter(file => /\.bas$/i.test(file))
   .sort((a, b) => a.localeCompare(b));

process.stdout.write(`SERIAL1,38400${CR}`);

for(const file of files) {
   const content = fs.readFileSync(path.join(folder, file), 'utf8')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/\n$/, '');
   const name = file.replace(/\.bas$/i, '').replace(/_/g, '-');

   process.stdout.write(`NEW${CR}`);
   for(const line of content.split('\n')) {
      process.stdout.write(line + CR);
   }
   process.stdout.write(`SAVE "${name}"${CR}`);
}
