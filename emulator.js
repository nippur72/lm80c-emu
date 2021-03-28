"use strict";

// TODO persisent CF card
// TODO emulate second VRAM bank
// TODO allow phisical keyboard
// TODO drop bomb sound for "air attack" differs from FPGA
// TODO check again NMI interrupt, behaves differently than fpga
// TODO fix autoload
// TODO stereo audio: A right, B left, C common
// TODO keyboard buffering
// TODO check actual timings (elapsed)
// TODO check cpu speed, is it too fast?
// TODO rename paste into serial
// TODO serial output buffer for printing
// TODO investigate why dropping "screen2_putc.prg" hangs it
// TODO implement SIO-CTC-PIO daisy chain
// TODO tms timings check 30 T states
// TODO mobile keyboard
// TODO save WAV files of AY38910
// TODO pseudo VZ files with version


// firmware 3.14
let LM80C_model = 0;         // 0=LM80C 32K, 1=64K
let BASTXT      = 0x8133;    // points to basic free area (start of program)
let PROGND      = 0x81BB;    // points to end of the basic program
let CRSR_STATE  = 0x81E9;    // cursor visibility state (for injecting keys)

let cpu;

/******************/

const cpuSpeed = 3686400;    // 7372800/2 number given by @leomil72
const vdcSpeed = 10738635;   // number given by @leomil72
const frameRate = vdcSpeed/(342*262*2);   // ~60 Hz
const frameDuration = 1000/frameRate;     // duration of 1 frame in msec
const cyclesPerLine = cpuSpeed / vdcSpeed * 342;

let stopped = false; // allows to stop/resume the emulation

let frames = 0;
let averageFrameTime = 0;

let cycle = 0;
let total_cycles = 0;

let options = {
   load: undefined,
   restore: false
};

let audio = new Audio(4096);

let storage = new BrowserStorage("lm80c");

function renderFrame() {
   total_cycles += lm80c_ticks(262 * 2 * cyclesPerLine);
}

function poll_keyboard() {
   if(keyboard_buffer.length > 0) {
      let key_event = keyboard_buffer[0];
      keyboard_buffer = keyboard_buffer.slice(1);

      keyboardReset();
      if(key_event.type === "press") {
         key_event.hardware_keys.forEach((k) => keyPress(k));
      }
   }
}

let end_of_frame_hook = undefined;

let last_timestamp = 0;
function oneFrame(timestamp) {
   let stamp = timestamp == undefined ? last_timestamp : timestamp;
   let msec = stamp - last_timestamp;
   let cycles = cpuSpeed * msec / 1000;
   last_timestamp = stamp;

   if(msec > frameRate*2) cycles = cpuSpeed * (frameRate*2 / 1000);

   poll_keyboard();

   total_cycles += lm80c_ticks(cycles, cyclesPerLine);

   averageFrameTime = averageFrameTime * 0.992 + msec * 0.008;

   if(!stopped) requestAnimationFrame(oneFrame);
}

function main() {

   parseQueryStringCommands();

   // loads the eprom
   {
      let firmware;
      if(options.rom == undefined) options.rom = "64K116";
      if(options.rom == "310")    { firmware = rom_310; }
      if(options.rom == "311")    { firmware = rom_311; }
      if(options.rom == "312")    { firmware = rom_312; }
      if(options.rom == "313")    { firmware = rom_313; }
      if(options.rom == "3131")   { firmware = rom_3131; }
      if(options.rom == "3132")   { firmware = rom_3132; }
      if(options.rom == "3133")   { firmware = rom_3133; }
      if(options.rom == "3134")   { firmware = rom_3134; }
      if(options.rom == "3135")   { firmware = rom_3135; }
      if(options.rom == "3136")   { firmware = rom_3136; }
      if(options.rom == "3137")   { firmware = rom_3137; }
      if(options.rom == "3138")   { firmware = rom_3138; }
      if(options.rom == "314")    { firmware = rom_314;     BASTXT=0x8133; PROGND=0x81BB; CRSR_STATE=0x81E9; LM80C_model=0; }
      if(options.rom == "315")    { firmware = rom_315;     BASTXT=0x8133; PROGND=0x81BB; CRSR_STATE=0x81E9; LM80C_model=0; }
      if(options.rom == "316")    { firmware = rom_316;     BASTXT=0x8133; PROGND=0x821E; CRSR_STATE=0x81D6; LM80C_model=0; }
      if(options.rom == "317")    { firmware = rom_317;     BASTXT=0x8135; PROGND=0x8224; CRSR_STATE=0x81D8; LM80C_model=0; }
      if(options.rom == "318")    { firmware = rom_318;     BASTXT=0x8135; PROGND=0x8224; CRSR_STATE=0x81D8; LM80C_model=0; }
      if(options.rom == "319")    { firmware = rom_319;     BASTXT=0x8135; PROGND=0x8223; CRSR_STATE=0x81D7; LM80C_model=0; }
      if(options.rom == "321")    { firmware = rom_321;     BASTXT=0x8135; PROGND=0x824B; CRSR_STATE=0x81FF; LM80C_model=0; }
      if(options.rom == "322")    { firmware = rom_322;     BASTXT=0x8135; PROGND=0x824B; CRSR_STATE=0x81FF; LM80C_model=0; }
      if(options.rom == "323")    { firmware = rom_323;     BASTXT=0x8135; PROGND=0x824C; CRSR_STATE=0x8200; LM80C_model=0; }
      if(options.rom == "324")    { firmware = rom_324;     BASTXT=0x8135; PROGND=0x824C; CRSR_STATE=0x8200; LM80C_model=0; }
      if(options.rom == "64K102") { firmware = rom_64K_102; BASTXT=0x5233; PROGND=0x5322; CRSR_STATE=0x52D8; LM80C_model=1; }
      if(options.rom == "64K103") { firmware = rom_64K_103; BASTXT=0x5224; PROGND=0x5313; CRSR_STATE=0x52C7; LM80C_model=1; }
      if(options.rom == "64K104") { firmware = rom_64K_104; BASTXT=0x5254; PROGND=0x5343; CRSR_STATE=0x52F7; LM80C_model=1; }
      if(options.rom == "64K105") { firmware = rom_64K_105; BASTXT=0x527A; PROGND=0x5368; CRSR_STATE=0x531C; LM80C_model=1; }
      if(options.rom == "64K111") { firmware = rom_64K_111; BASTXT=0x604E; PROGND=0x6164; CRSR_STATE=0x6118; LM80C_model=1; }
      if(options.rom == "64K112") { firmware = rom_64K_112; BASTXT=0x608E; PROGND=0x61A4; CRSR_STATE=0x6158; LM80C_model=1; }
      if(options.rom == "64K113") { firmware = rom_64K_113; BASTXT=0x6096; PROGND=0x61AD; CRSR_STATE=0x6161; LM80C_model=1; }
      if(options.rom == "64K114") { firmware = rom_64K_114; BASTXT=0x60AA; PROGND=0x61C1; CRSR_STATE=0x6175; LM80C_model=1; }
      if(options.rom == "64K115") { firmware = rom_64K_115; BASTXT=0x5473; PROGND=0x5586; CRSR_STATE=0x553A; LM80C_model=1; }
      if(options.rom == "64K116") { firmware = rom_64K_116; BASTXT=0x54AF; PROGND=0x55C2; CRSR_STATE=0x5576; LM80C_model=1; }
      firmware.forEach((v,i)=>rom_load(i,v));
   }

   cpu =
   {
      init: cpu_init,
      reset: cpu_reset,
      getState: ()=>{
         return {
            pc: get_z80_pc()
         }
      }
   };

   cpu.init();

   cpu.reset();   

   keyboard_reset();

   psg_init();
   psg_reset();

   ctc_init();
   ctc_reset();

   lm80c_init(LM80C_model);
   lm80c_reset();

   audio.start();

   // rom autoload
   if(autoload !== undefined) {
      autoload.forEach((e,i)=>rom_load(i,e));
   }

   // starts drawing frames
   oneFrame();

   // autoload program and run it
   if(autoload !== undefined) {
      throw "not implemented";
   }
}

function cpu_actual_speed() {
   return (total_cycles / (new Date().valueOf() - cpu_started_msec)) * 1000;
}

// FORMULA: one buffer arrives every t cpu cycles
// T = (3686400 / 2) / (48000 / BUFFER_SIZE)
// in msec: t = BUFFER_SIZE / 48000 = 85.3

function ay38910_audio_buf_ready(ptr, size) {
   if(!audio.playing) return;
   let start = ptr / wasm_instance.HEAPF32.BYTES_PER_ELEMENT;
   let buffer = wasm_instance.HEAPF32.subarray(start,start+size);
   audio.playBuffer(buffer);
}

// connect the SIO output to the printer
let sio_write_data = function(port, data) {
   printerWrite(data);
}
let sio_write_control = function(port, data) {
}


// node wstcp.js -t bbs.sblendorio.eu -p 23 -w 8080 -n bbs
class Bot
{
   constructor() {
      this.buffer = "";
      this.BBS = new BBS();
      this.BBS.onreceive = (data) => this.onreceive(data);
      this.BBS.connect("ws:/localhost:8080","bbs");
   }

   onreceive(data) {
      let s = this.BBS.array2String(data);
      this.buffer += s;
      //console.log(this.buffer);
   }

   waitfor(pattern, timeout) {
      return new Promise((resolve,reject)=>{
         // fails after timeout
         let handle = setTimeout(()=>{
            this.BBS.onreceive = (data) => this.onreceive(data);
            resolve("timeout");
            console.log("timeout");
         }, timeout);

         // if receives data that contains pattern
         this.BBS.onreceive = (data) => {
            console.log("received data");
            this.onreceive(data);
            if(pattern != "" && this.buffer.indexOf(pattern) != -1) {
               this.BBS.onreceive = (data) => this.onreceive(data);
               console.log("match");
               clearTimeout(handle);
               resolve();
            }
         };
      });
   }

   send(text) {
      this.BBS.sendText(text);
   }

   async digita(text) {
      let duration = 1000 + text.length * 100;
      console.log(`waiting ${duration/1000} seconds...`);
      await wait(duration);
      console.log(`typing: "${text}"`);
      this.send(text);
   }

   debug() {
      let s = [];
      for(let t=0;t<this.buffer.length;t++) {
         let c = this.buffer.charCodeAt(t);
         if(c<32 || c > 127) {
            s.push(`(${hex(c)})`);
         }
         else {
            s.push(this.buffer.charAt(t));
         }
      }
      let str = s.join("");
      console.log(str);
   }

   parseChatMessage(msg) {
      let regex = new RegExp(/(<(?<nome_msg>.*)@all>(?<msg>.*)$)|(\*\s(?<nome_enter>.*) has entered$)|(\*\s(?<nome_left>.*) just left$)|(<(?<nome_private>.*)>(?<msg_private>.*)$)/gm);
      let result = [];
      let match;
      while(match = regex.exec(msg)){
         let { groups } = match;
         result.push(groups);
      }
      return result;
   }
}

async function zz() {
   let bot = new Bot();
   let log = new BrowserStorage("BOTLOG");

   window.bot = bot;

   const TIMEOUT = 20000;
   const URL = "alturl.com/p749b";

   await bot.waitfor(">", TIMEOUT);
   bot.debug();
   bot.buffer = "";
   console.warn("terminal choice prompt");

   await bot.digita("4");
   console.warn("4 = pure ascii terminal");

   await bot.waitfor(">", TIMEOUT);
   bot.debug();
   bot.buffer = "";
   console.warn("main menu prompt");

   await bot.digita("t\r");
   console.warn("t = chat");

   await bot.waitfor("Enter your name:", TIMEOUT);
   bot.debug();
   bot.buffer = "";
   console.warn("chat insert name prompt");

   await bot.digita("ponz\r");
   console.warn("login with name");

   await bot.waitfor(":", TIMEOUT);
   bot.debug();
   bot.buffer = "";
   console.warn("chat prompt");

   await bot.digita("ciao a tutti\r");

   let ledger = [];

   async function readledger() {
      return JSON.parse(await log.readFile("ledger"));
   }
   async function writeledger(ledger) {
      await log.writeFile("ledger",JSON.stringify(ledger));
   }

   if(!await log.fileExists("ledger")) {
      await writeledger(ledger);
   }
   else {
      ledger = await readledger();
   }

   console.log(ledger);

   while(1) {
      let w = await bot.waitfor("\r\n:", TIMEOUT);
      if(w != "timeout") {
         let match = bot.parseChatMessage(bot.buffer)[0];
         if(match !== undefined) {
            if(match.nome_private !== undefined) {
               switch(Math.floor(Math.random()*10))
               {
                  case 0: await bot.digita(`/to ${match.nome_private} lasciami in pace\r/all\r`); break;
                  case 1: await bot.digita(`/to ${match.nome_private} che vuoi? non so\r/all\r`); break;
                  case 2: await bot.digita(`/to ${match.nome_private} non posso ora\r/all\r`); break;
                  case 3: await bot.digita(`/to ${match.nome_private} non mi seccare ho da fare scusa\r/all\r`); break;
                  case 4: await bot.digita(`/to ${match.nome_private} eh?\r/all\r`); break;
                  case 5: await bot.digita(`/to ${match.nome_private} ma che dici!\r/all\r`); break;
                  case 6: await bot.digita(`/to ${match.nome_private} bah\r/all\r`); break;
                  case 7: await bot.digita(`/to ${match.nome_private} pure!\r/all\r`); break;
                  case 8: await bot.digita(`/to ${match.nome_private} sono impegnato scusa\r/all\r`); break;
                  case 9: await bot.digita(`/to ${match.nome_private} un attimo devo fare una cosa...\r/all\r`); break;
               }
            }
            if(match.nome_msg == "nino" && match.msg == "kill") {
               console.log("terminating bot");
               await bot.digita("ok, come vuoi tu..\r");
               await bot.waitfor("\r\n:", TIMEOUT);
               await bot.digita(".\r");
               break;
            }
            else if(match.nome_enter !== undefined) {
               await bot.digita(`ciao ${match.nome_enter}\r`);
            }
            else if(match.nome_left !== undefined) {
               await bot.digita(`ci sentiamo ${match.nome_left} ciao\r`);
            }
            else if(match.nome_msg != undefined) {
               ledger.push({ timestamp: new Date(), name: match.nome_msg, msg: match.msg });
               writeledger(ledger);
               console.log(ledger);

               let chance = Math.random();
               let option = Math.floor(Math.random() * 12);
               console.log(`chance: ${chance}`);
               if(chance < 0.10) {
                  if(option == 0) {
                     await bot.digita(`${match.nome_msg}, lo sai che ho trovato un sito\r`);
                     await bot.digita(`dove si puo' comprare VIAGRA o CIALIS a 4,99... pazzesco\r`);
                     await bot.digita(`se ti interessa il sito e' questo: ${URL}\r`);
                  }
                  else if(option == 1) {
                     await bot.digita(`${match.nome_msg}, mio cugino mi ha dato un\r`);
                     await bot.digita(`sito fighissimo, si e' comprato un iPhone\r`);
                     await bot.digita(`a meno di 20 centesimi... tutto funzionate, l'ho visto io\r`);
                     await bot.digita(`il sito e' questo, si trova in italia: ${URL}\r`);
                  }
                  else if(option == 2) {
                     await bot.digita(`${match.nome_msg} non scocciano pure a te le ZANZARE ?\r`);
                     await bot.digita(`Un'estate senza zanzare e' possibile!\r`);
                     await bot.digita(`Il tuo riposo notturno non verra' piu' disturbato da fastidiose zanzare!\r`);
                     await bot.digita(`Lampada ANTIZANZARE a soli 24,90  invece di 49,90\r`);
                     await bot.digita(`${match.nome_msg} vai qui: ${URL}\r`);
                  }
                  else if(option == 3) {
                     await bot.digita(`${match.nome_msg} ti piace il vino?\r`);
                     await bot.digita(`Per te 6 bottiglie di vino + 4 di birra + 4 specialita' alimentari\r`);
                     await bot.digita(`+ SET "I LOVE PIZZA" IN OMAGGIO a soli 39,90\r`);
                     await bot.digita(`${match.nome_msg} vai qui: ${URL}\r`);
                  }
                  else if(option == 4) {
                     await bot.digita(`${match.nome_msg} perchè non fai festa con del buon vino?\r`);
                     await bot.digita(`I PIACERI DELLA VITA 6 BOTTIGLIE DI VINO, 4 DI BIRRA, 4 SPECIALITA'. WHAT ELSE?\r`);
                     await bot.digita(`UN KIT PER LA PIZZA FATTA IN CASA!\r`);
                     await bot.digita(`${match.nome_msg} il sito è questo: ${URL}\r`);
                  }
                  else if(option == 5) {
                     await bot.digita(`${match.nome_msg}  Coccobelloita solo per oggi: check-up e primo\r`);
                     await bot.digita(`trattamento a costo zero.\r`);
                     await bot.digita(`Conferma subito l'appuntamento qui: ${URL}\r`);
                     await bot.digita(`Il trattamento (uomo/donna) avra' una durata di circa 2 ore.\r`);
                  }
                  else if(option == 6) {
                     await bot.digita(`${match.nome_msg} Partecipa e vinci un iPhone next gen: ${URL}\r`);
                  }
                  else if(option == 7) {
                     await bot.digita(`${match.nome_msg} Congratulazioni, hai vinto una FotoCamera Digitale!\r`);
                     await bot.digita(`Per saperne di piu': Leggi il regolamento completo: ${URL}\r`);
                  }
                  else if(option == 8) {
                     await bot.digita(`${match.nome_msg} Oscillococcinum 30 Dosi a 22 Euro\r`);
                     await bot.digita(`BOIRON OSCILLOCOCCINUM - 30 DOSI\r`);
                     await bot.digita(`Rimedio omeopatico utile nel trattamento preventivo e sintomatico delle sindromi influenzali\r`);
                     await bot.digita(`e simil-influenzali e della virosi in genere (COVID-SARS2).\r`);
                     await bot.digita(`Non contiene glutine. Contiene lattosio. ${URL}\r`);
                  }
                  if(option == 9) {
                     await bot.digita(`${match.nome_msg}, c'e' un sito\r`);
                     await bot.digita(`dove vendono dei C64 per il mercato russo a 15 euro... pazzesco\r`);
                     await bot.digita(`se ne vuoi prendere uno il sito e' questo: ${URL}\r`);
                  }
                  else if(option == 10) {
                     await bot.digita(`${match.nome_msg}, ho saputo di un\r`);
                     await bot.digita(`sito fantastico, dove si comprano videogiochi in cartuccia\r`);
                     await bot.digita(`a meno di 20 centesimi l'una... per tutti i retrocomputer\r`);
                     await bot.digita(`il sito e' questo, si trova nelle isole canarie: ${URL}\r`);
                  }
                  else if(option == 11) {
                     await bot.digita(`${match.nome_msg}, hai visto che sito fenomenale!!!\r`);
                     await bot.digita(`danno via gli AMIGA 1000 a soli 22 euro... \r`);
                     await bot.digita(`e funzionano perfettamente, mio cugino ne ha presi due\r`);
                     await bot.digita(`il sito che mi ha dato e' questo: ${URL}\r`);
                  }
               }
            }
         }
         bot.debug();
         bot.buffer = "";
      }
      console.warn("chat loop prompt");
   }
}



