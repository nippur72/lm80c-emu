import { io_write, SIO_receiveChar, SIO_getRTS, SIO_getRxAvail, SIO_getFifoLen } from './emscripten_wrapper';

// porta di controllo del canale A dell'SIO (0x20 = dati A, 0x21 = dati B, 0x22 = ctrl A)
const SIO_CA = 0x22;

// baud usato quando l'emulatore apre la seriale da solo (il modello SIO ignora il baud)
const SERIAL_BPS = 38400;

const WAIT_TIMEOUT_MS = 5000;   // attesa massima per la prontezza della macchina
const OPEN_TIMEOUT_MS = 2000;   // attesa massima perché il firmware apra la seriale

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function waitWhile(cond: () => boolean, timeoutMs: number): Promise<void> {
   const t0 = Date.now();
   while(cond()) {
      await sleep(1);
      if(Date.now() - t0 > timeoutMs) break;
   }
}

// diventa true quando si è osservato RTS asserito: da quel momento si rispetta il
// flow-control hardware del firmware
let rtsFlowControl = false;

// attende che la macchina sia pronta a ricevere il byte successivo:
//  - il SIO deve aver consegnato e il firmware letto il byte precedente (niente accumulo)
//  - se la seriale è aperta, RTS deve essere asserito (niente overflow del buffer firmware)
async function waitReady(): Promise<void> {
   if(SIO_getRTS(0)) rtsFlowControl = true;
   await waitWhile(() =>
      SIO_getRxAvail(0) !== 0 ||
      SIO_getFifoLen(0) > 0 ||
      (rtsFlowControl && SIO_getRTS(0) === 0),
      WAIT_TIMEOUT_MS
   );
}

// iniezione "grezza" (fuori coda): usata solo dal bootstrap di apertura della seriale
async function injectNow(c: number): Promise<void> {
   await waitReady();
   SIO_receiveChar(c);
}

let openPromise: Promise<void> | undefined;

// da chiamare quando la macchina viene resettata: il firmware riparte da zero, quindi
// RTS può non essere più asserito e la seriale va riaperta
export function resetSerial(): void {
   rtsFlowControl = false;
   openPromise = undefined;
}

// apre la seriale se non lo è già. Non tocca la RAM del firmware: abilita RX+interrupt
// dell'SIO (puro SIO) e fa eseguire al firmware il suo comando SERIAL, che configura la
// porta (SERIALS_EN, SERABITS, CTC, WR*) e attiva RTS.
export function ensureSerialOpen(): Promise<void> {
   if(openPromise === undefined) openPromise = openSerial();
   return openPromise;
}

async function openSerial(): Promise<void> {
   if(SIO_getRTS(0)) return;                        // già aperta

   // abilita l'interrupt RX e il ricevitore dell'SIO (WR0 seleziona il registro, poi il valore)
   io_write(SIO_CA, 0x01); io_write(SIO_CA, 0x18);  // WR1: interrupt su ogni char ricevuto
   io_write(SIO_CA, 0x03); io_write(SIO_CA, 0x01);  // WR3: RX enable

   // "digita" il comando del firmware che apre la porta 1 (canale A)
   const cmd = `SERIAL1,${SERIAL_BPS}\r`;
   for(const ch of cmd) await injectNow(ch.charCodeAt(0));

   // attende che il firmware abiliti davvero la porta (A_RTS_ON al prompt BASIC)
   await waitWhile(() => SIO_getRTS(0) === 0, OPEN_TIMEOUT_MS);
}

// coda: garantisce che le iniezioni avvengano in ordine, una alla volta
let queue: Promise<void> = Promise.resolve();

// inietta un byte nel SIO, aprendo la seriale se necessario
export function sendSerialChar(c: number): Promise<void> {
   queue = queue.then(async () => {
      await ensureSerialOpen();
      await injectNow(c);
   });
   return queue;
}
