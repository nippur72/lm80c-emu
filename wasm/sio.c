#include "lm80c.h"

// *************************************************************************************
// Z80 SIO (Z8440) — emulazione in modalità asincrona
//
// Due canali indipendenti (A = ch 0, B = ch 1), ognuno con:
//   - register file WR0..WR7 e read register RR0..RR2
//   - register pointer (3 bit bassi di WR0): un byte "piccolo" (0x00..0x07) scritto
//     sul port di controllo seleziona il registro; dopo l'accesso il pointer torna a WR0
//   - linee di modem: RTS/DTR in uscita (WR5), CTS/DCD/DSR in ingresso
//   - interrupt vettorizzati in IM2 (vettore = base WR2 | canale | sorgente)
//
// Semplificazioni (l'emulatore non è cycle-accurate):
//   - solo modalità asincrona: niente SDLC/sync, CRC o framing a livello di bit
//   - TX istantaneo: il byte va subito al mondo esterno via sio_write_data()
//   - RX con pacing a tick (come la versione precedente): 1 byte ogni SIO_RX_DELAY_TICKS
//   - nessun motore baud: il clock è il tick della CPU
//
// NOTA sull'interrupt RX: il firmware non apre più la seriale al boot (dal bootloader
// R2.15), quindi l'SIO resta non inizializzato (WR1=0 => interrupt RX disabilitato). Il
// modello è fedele: l'interrupt RX richiede WR1 abilitato. L'emulatore, prima di iniettare
// dati (paste / tastiera seriale / modem), abilita l'interrupt RX programmando WR1 e poi fa
// eseguire al firmware il comando SERIAL, che configura la porta e attiva RTS.
// *************************************************************************************

#define SIO_NCH            2        // 0 = canale A, 1 = canale B
#define SIO_RX_FIFO        4096
#define SIO_RX_DELAY_TICKS 25000

// sorgenti di interrupt (codice nei bit V2V1 del vettore)
#define SIO_SRC_TXEMPTY    0
#define SIO_SRC_EXTSTAT    1
#define SIO_SRC_RXAVAIL    2
#define SIO_SRC_SPECIAL    3
#define SIO_SRC_NONE       (-1)

typedef struct {
   byte wr[8];          // WR0..WR7
   byte rptr;           // registro puntato (3 bit bassi di WR0); 0 = WR0

   bool rxEnabled;      // WR3 bit0
   bool txEnabled;      // WR5 bit3
   bool brk;            // WR5 bit4 (latch)
   bool rts;            // WR5 bit1
   bool dtr;            // WR5 bit7

   bool cts, dcd, dsr;  // ingressi modem (default asseriti)

   bool rxAvail;        // RR0 bit0
   bool txEmpty;        // RR0 bit2
   bool allSent;        // RR1 bit0
   byte errLatches;     // RR1: D3 parity, D4 overrun, D5 framing

   bool intRxEnable;         // WR1 bit4
   bool intSpecialEnable;    // WR1 bit3
   bool statusAffectsVector; // WR1 bit2

   int  intSource;      // SIO_SRC_NONE oppure sorgente pendente

   byte rxData;         // registro dati RX
   byte fifo[SIO_RX_FIFO];        // byte ricevuti dall'esterno
   int  fifoLen;
   int  tickCounter;
} sio_chan_t;

static sio_chan_t sio[SIO_NCH];

int SIO_INT  = 0;    // pin INT: 1 da trigger fino a M1+IORQ (ACK)
int SIO_busy = 0;    // 1 = SIO sta servendo l'interrupt: da trigger a RETI

// *************************************************************************************
// stato degli interrupt
// *************************************************************************************

// intSource viene impostato solo quando l'interrupt è effettivamente abilitato (o
// forzato per i byte iniettati dall'emulatore), quindi basta controllarne la presenza
static int sio_int_pending(int ch) {
   return sio[ch].intSource >= 0;
}

static void sio_update_int(void) {
   for (int ch = 0; ch < SIO_NCH; ch++) {
      if (sio_int_pending(ch)) { SIO_INT = 1; return; }
   }
   SIO_INT = 0;
}

// vettore IM2: D7..D4 dalla base WR2, D3 = canale (1 = A), D2..D1 = sorgente
static byte sio_vector(int ch) {
   int src = sio[ch].intSource;
   if (src < 0) src = 0;
   return (byte) ((sio[ch].wr[2] & 0xF0) | (ch == 0 ? 0x08 : 0x00) | (src << 1));
}

// *************************************************************************************
// reset / configurazione dei registri
// *************************************************************************************

static void sio_channel_reset(int ch) {
   sio_chan_t* c = &sio[ch];
   for (int i = 0; i < 8; i++) c->wr[i] = 0;
   c->rptr                = 0;
   c->rxEnabled           = false;
   c->txEnabled           = false;
   c->brk                 = false;
   c->rts                 = false;
   c->dtr                 = false;
   c->rxAvail             = false;
   c->txEmpty             = true;
   c->allSent             = true;
   c->errLatches          = 0;
   c->intRxEnable         = false;
   c->intSpecialEnable    = false;
   c->statusAffectsVector = false;
   c->intSource           = SIO_SRC_NONE;
   c->rxData              = 0;
   c->fifoLen             = 0;
   c->tickCounter         = 0;
}

static void sio_apply_reg(int ch, byte reg, byte data) {
   sio_chan_t* c = &sio[ch];
   switch (reg) {
      case 1:
         c->intRxEnable         = (data & 0x10) != 0;
         c->intSpecialEnable    = (data & 0x08) != 0;
         c->statusAffectsVector = (data & 0x04) != 0;
         break;
      case 3:
         c->rxEnabled = (data & 0x01) != 0;
         break;
      case 5:
         c->dtr       = (data & 0x80) != 0;
         c->brk       = (data & 0x10) != 0;
         c->txEnabled = (data & 0x08) != 0;
         c->rts       = (data & 0x02) != 0;
         break;
      default:
         break;
   }
}

// *************************************************************************************
// accesso ai registri (chiamate da io.c)
// *************************************************************************************

static byte sio_read_rr0(int ch) {
   sio_chan_t* c = &sio[ch];
   byte v = 0;
   if (c->rxAvail) v |= 0x01;   // D0 Rx Character Available
   if (c->txEmpty) v |= 0x04;   // D2 Tx Buffer Empty
   if (c->dcd)     v |= 0x08;   // D3 DCD
   if (c->cts)     v |= 0x20;   // D5 CTS
   return v;
}

static byte sio_read_rr1(int ch) {
   sio_chan_t* c = &sio[ch];
   byte v = c->errLatches;
   if (c->allSent) v |= 0x01;   // D0 All Sent
   return v;
}

static byte sio_control_read(int ch) {
   sio_chan_t* c = &sio[ch];
   byte rr;
   switch (c->rptr) {
      case 0:  rr = sio_read_rr0(ch); break;
      case 1:  rr = sio_read_rr1(ch); break;
      case 2:  rr = sio_vector(ch);   break;
      default: rr = 0;                break;
   }
   c->rptr = 0;   // il pointer torna a WR0 dopo l'accesso
   return rr;
}

static void sio_control_write(int ch, byte data) {
   sio_chan_t* c = &sio[ch];

   if (c->rptr == 0) {
      // scrittura in WR0: i 3 bit bassi sono il register pointer, i bit 5..3 i comandi
      c->wr[0] = data;
      if ((data & 0x18) == 0x18) {
         sio_channel_reset(ch);        // Channel Reset
      }
      else if (data & 0x10) {
         c->errLatches = 0;            // Reset Error
      }
      c->rptr = data & 0x07;
   }
   else {
      byte reg = c->rptr;
      c->wr[reg] = data;
      sio_apply_reg(ch, reg, data);
      c->rptr = 0;
   }

   sio_update_int();
   byte unused = (byte) EM_ASM_INT({ sio_write_control($0, $1); }, ch, data);
   (void) unused;
}

static byte sio_data_read(int ch) {
   sio_chan_t* c = &sio[ch];
   c->rxAvail = false;
   if (c->intSource == SIO_SRC_RXAVAIL) {
      c->intSource = SIO_SRC_NONE;
      sio_update_int();
   }
   return c->rxData;
}

static void sio_data_write(int ch, byte value) {
   sio_chan_t* c = &sio[ch];
   c->txEmpty = true;
   c->allSent = true;
   byte unused = (byte) EM_ASM_INT({ sio_write_data($0, $1); }, ch, value);
   (void) unused;
}

byte SIO_readPortCA(void) { return sio_control_read(0); }
byte SIO_readPortCB(void) { return sio_control_read(1); }
byte SIO_readPortDA(void) { return sio_data_read(0); }
byte SIO_readPortDB(void) { return sio_data_read(1); }

void SIO_writePortCA(byte value) { sio_control_write(0, value); }
void SIO_writePortCB(byte value) { sio_control_write(1, value); }
void SIO_writePortDA(byte value) { sio_data_write(0, value); }
void SIO_writePortDB(byte value) { sio_data_write(1, value); }

// *************************************************************************************
// RX dal mondo esterno + pacing
// *************************************************************************************

static void sio_push(int ch, byte c) {
   sio_chan_t* s = &sio[ch];
   if (s->fifoLen < SIO_RX_FIFO - 1) {
      s->fifo[s->fifoLen++] = c;
   }
   // else: overflow del buffer esterno (TODO: segnalazione)
}

EMSCRIPTEN_KEEPALIVE
void SIO_receiveChar(byte c) { sio_push(0, c); }

EMSCRIPTEN_KEEPALIVE
void SIO_receiveCharB(byte c) { sio_push(1, c); }

// *************************************************************************************
// tick: consegna i byte ricevuti con il pacing del baud e alza l'interrupt RX
// ritorna il pin INT dell'SIO
// *************************************************************************************
uint8_t sio_ticks(int ticks) {
   if (SIO_INT) return (uint8_t) SIO_INT;

   for (int ch = 0; ch < SIO_NCH; ch++) {
      sio_chan_t* c = &sio[ch];
      if (c->fifoLen == 0) continue;

      c->tickCounter += ticks;
      if (c->tickCounter <= SIO_RX_DELAY_TICKS) continue;

      c->tickCounter = 0;
      byte data = c->fifo[0];
      for (int t = 1; t < c->fifoLen; t++) c->fifo[t-1] = c->fifo[t];
      c->fifoLen--;

      if (c->rxAvail) {
         // dato precedente non ancora letto: overrun (RR1 bit4)
         c->errLatches |= 0x10;
         if (c->intSpecialEnable) c->intSource = SIO_SRC_SPECIAL;
      }
      else {
         c->rxData  = data;
         c->rxAvail = true;
         if (c->intRxEnable) {
            if (c->intSource < 0) c->intSource = SIO_SRC_RXAVAIL;
            SIO_busy = 1;
         }
      }
   }

   sio_update_int();
   return (uint8_t) SIO_INT;
}

// *************************************************************************************
// ACK dell'interrupt: ritorna il vettore del canale a priorità più alta (A > B)
// *************************************************************************************
uint8_t sio_int_ack_vector(void) {
   byte vec = 0;
   for (int ch = 0; ch < SIO_NCH; ch++) {
      if (sio_int_pending(ch)) {
         vec = sio_vector(ch);
         sio[ch].intSource = SIO_SRC_NONE;
         break;
      }
   }
   sio_update_int();
   return vec;
}

// chiamata dal CPU tick quando viene trovata una RETI
void SIO_cpu_found_RETI(void) {
   if (SIO_INT) SIO_busy = 0;
}

// *************************************************************************************
// init / reset
// *************************************************************************************

EMSCRIPTEN_KEEPALIVE
void SIO_reset(void) {
   SIO_INT  = 0;
   SIO_busy = 0;
   for (int ch = 0; ch < SIO_NCH; ch++) {
      sio_channel_reset(ch);
      sio[ch].cts = true;    // modem pronto per default (nessun blocco TX)
      sio[ch].dcd = true;
      sio[ch].dsr = true;
   }
}

EMSCRIPTEN_KEEPALIVE
void SIO_init(void) {
   SIO_reset();
}

// *************************************************************************************
// API verso l'esterno (JS)
// *************************************************************************************

EMSCRIPTEN_KEEPALIVE
int SIO_getRTS(byte ch) { return (ch < SIO_NCH) && sio[ch].rts; }

EMSCRIPTEN_KEEPALIVE
int SIO_getDTR(byte ch) { return (ch < SIO_NCH) && sio[ch].dtr; }

EMSCRIPTEN_KEEPALIVE
int SIO_getCTS(byte ch) { return (ch < SIO_NCH) && sio[ch].cts; }

// introspezione per test/debug: stato del pin INT
EMSCRIPTEN_KEEPALIVE
int SIO_getInt(void) { return SIO_INT; }

EMSCRIPTEN_KEEPALIVE
int SIO_getRxAvail(byte ch) { return (ch < SIO_NCH) && sio[ch].rxAvail; }

EMSCRIPTEN_KEEPALIVE
int SIO_getFifoLen(byte ch) { return (ch < SIO_NCH) ? sio[ch].fifoLen : 0; }

EMSCRIPTEN_KEEPALIVE
int SIO_getOverrun(byte ch) { return (ch < SIO_NCH) && (sio[ch].errLatches & 0x10); }

EMSCRIPTEN_KEEPALIVE
void SIO_setCTS(byte ch, bool level) { if (ch < SIO_NCH) sio[ch].cts = level; }

EMSCRIPTEN_KEEPALIVE
void SIO_setDCD(byte ch, bool level) { if (ch < SIO_NCH) sio[ch].dcd = level; }

EMSCRIPTEN_KEEPALIVE
void SIO_setDSR(byte ch, bool level) { if (ch < SIO_NCH) sio[ch].dsr = level; }

EMSCRIPTEN_KEEPALIVE
byte SIO_getReg(byte ch, byte reg) {
   return (ch < SIO_NCH && reg < 8) ? sio[ch].wr[reg] : (byte) 0;
}
