// paste fake basic program
(function() {
   let c=0;
   let s="";

   for(let t=1;t<300;t++) {
      s+=`${t} A=A+${t}\r`;
      c+=t;
   }
   s+="9999 PRINT A\rRUN\r";
   pasteLine(s);
   console.log(c);
})();



// prova di lettura dal psg port B
(function() {
   let PORT_A_WR = 1<<6;
   let PORT_B_WR = 1<<7;
   let PORT_A_RD = 0;
   let PORT_B_RD = 0;
   let r;

   psg_init();
   psg_reset();

   psg_write(0x40, 7);
   console.log(psg_query_addr());

   psg_write(0x41, PORT_A_WR|PORT_B_RD);
   console.log(psg_query_reg(7));

   /*
   psg_write(0x40, 15);
   console.log(psg_query_addr());

   let x = psg_read(0x40);
   console.log(x);
   */

   psg_write(0x40, 14);
   console.log(psg_query_addr());

   psg_write(0x41, 77);
   console.log(psg_query_addr());
})();


// topaz font
for(let t=0;t<topaz.length/2;t++) rom[0x4383+t] = topaz[t*2];

// laser 500 fonts
(function() {
   function reverse(b) {
      b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
      b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
      b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
      return b;
   }
   for(let t=33*8;t<127*8;t++) rom[0x4383+t] = reverse(charset_laser500[(256*8)*4+t]);
})();



paste(`
0 PRINT CHR$(159.5+RND(1));:GOTO
`)

paste(`
90 print "wait..."
100 dim f(32)
110 for i=0 to 31
120 x=440*2^((i-12)/12)
140 f(i)=4096-(115206.1875/x)
150 next
160 cls
161 print "*** LM80C Piano ***"
162 print
163 print "by Antonino Porcino, 2020"
164 print:print
165 print "  2 3   5 6 7   9 0
166 print " Q W E R T Y U I O P
167 print
168 print "  S D   G H J
169 print " Z X C V B N M
174 volume 1,15
175 a$="zsxdcvgbhnjmq2w3er5t6y7ui9o0p"
180 x=inkey(10):if x=0 then 180
190 x=instr(a$,chr$(x))
200 if x=0 then 180
210 sound 1,f(x),50
220 goto 180
`)

(function (){
   debugBefore = ()=>
   {
      let state = cpu.getState();
      if(state.pc == 0x2982 && (state.a != 191 && state.a !=183)) console.log(`a=${state.a}`);
   }
})();

paste(`
10 volume 1,15
20 for t=4001 to 4095 step 2
25 print t
30 sound 1,t,20:pause 20
40 next
`)

paste(`
100 input x
110 f = 4096-(115206.1875/x)
120 print f
130 volume 1,15
140 sound 1,f,200
`)


paste(`
10 volume 1,15
20 sound 1,rnd(1)*4095,10
30 pause 10
40 goto 20
`)

paste(`
10 volume 1,15
20 sound 4,10:sound 4,0
30 if sstat(7)<>191 then print sstat(7)
40 goto 20
`)


// test BBS
(async function() {
   let m = new BBS();
   let buf = "";
   m.onreceive = (d) => {
      console.log(d);
   }
   await m.connect("ws:/localhost:8080","bbs");
   await wait(500);
   m.sendText("5");   // 5 = pure ascii
   await wait(500);
   m.sendText("T\r");   // t = chat
   await wait(500);
   m.sendText("pappagallo\r");
   await wait(500);
   /*
   m.sendText("ciao, sono un bot e faccio spam\r");
   await wait(500);
   m.sendText("compra viagra e cialis a soli 4,99\r");
   await wait(500);
   */
   window.m = m;
}());

// test modem
(function() {
   let m = new VirtualModem();
   m.connect();
   let buf = "";

   function send(text) {
      for(let t=0;t<text.length;t++) {
         m.write_byte(text.charCodeAt(t));
      }
   }

   function tick() {
      while(m.read_status()) {
         buf += String.fromCharCode(m.read_byte());
      }
      if(buf!="") console.log(buf);
   }

   function get_input(pattern) {
      while(1) {
         tick();
         let x = buf.indexOf(text);
         if(x!=-1) {
            buf = buf.slice(x+text.length);
            return buf;
         }
      }
   }

   window.send = send;
   window.tick = tick;
   window.get_input = get_input;

}());

paste(`
100 open "mario",1,1
110 for i=1 to 10
120 put 1,i
130 next
140 close 1
150 open "mario",1,0
160 n=eof(0)
170 for i=1 to n
180 print get(1)
190 next
200 close 1
`)

// *************************************************************************************
// *************************************************************************************
// ****************************** BBS BOT **********************************************
// *************************************************************************************
// *************************************************************************************

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

   await bot.digita("scas\r");
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
               if(chance < 0.50) {
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
