#include "lm80c.h"
#include "tms9928.h"

byte led_read(byte port)  {
   return EM_ASM_INT({ return led_read(); }, 0);
}

void led_write(byte port, byte value) {
   byte unused = (byte) EM_ASM_INT({ led_write($0); }, value);
}

byte cf_read(word port) {
   byte value = (byte) EM_ASM_INT({ return cf_read($0) }, port);
   return value;
}

void cf_write(word port, byte value) {
   byte unused = (byte) EM_ASM_INT({ cf_write($0, $1); }, port, value);
}

extern tms9928_t vdp;

// simplified LED bits control
// bit 0: 0=RAM    1=ROM
// bit 1: 0=VRAM0  1=VRAM1

byte PIO_data_B;

EMSCRIPTEN_KEEPALIVE
byte io_read(word ioport) {
   byte port = ioport & 0xFF;

   switch(port) {
      case 0x00: return 0x00;        // PIO data channel A
      case 0x01: return PIO_data_B;  // PIO data channel B
      case 0x02: return 0x00;        // PIO control A
      case 0x03: return 0x00;        // PIO control B

      case 0x10:
      case 0x11:
      case 0x12:
      case 0x13: return ctc_read(port & 3);  // CTC

      case 0x20: return SIO_readPortDA();    // SIO_DA
      case 0x21: return SIO_readPortDB();    // SIO_DB
      case 0x22: return SIO_readPortCA();    // SIO_CA
      case 0x23: return SIO_readPortCB();    // SIO_CB

      case 0x030:  return tms9928_vram_read(&vdp);
      case 0x031:  return LM80C_64K == 1 ? tms9928_register_read(&vdp) : port;  // LM80C 64K model
      case 0x032:  return LM80C_64K == 0 ? tms9928_register_read(&vdp) : port;  // LM80C 32K model

      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: return psg_read(port);

      case 0x50:
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57: return cf_read(port);

      case 0xFF: return led_read(port);

      default:
         //console.warn(`read from unknown port ${hex(port)}h`);
         return port; // checked on the real HW
   }
 }

EMSCRIPTEN_KEEPALIVE
void io_write(word ioport, byte value) {
   byte port = ioport & 0xFF;

   // console.log(`io write ${hex(port)} ${hex(value)}`)
   switch(port) {
      // PIO DATAREGA
      case 0x00: return;
      case 0x01: PIO_data_B = value; return;
      case 0x02: return;
      case 0x03: return;

      case 0x10:
      case 0x11:
      case 0x12:
      case 0x13: ctc_write(port & 3, value); return;

      // SIO 0x20-23
      case 0x20: SIO_writePortDA(value); return; // SIO_DA equ %00100000
      case 0x21: SIO_writePortDB(value); return; // SIO_DB equ %00100001
      case 0x22: SIO_writePortCA(value); return; // SIO_CA equ %00100010
      case 0x23: SIO_writePortCB(value); return; // SIO_CB equ %00100011

      // TMS9918: 0x30-0x33
      case 0b00110000: tms9928_vram_write(&vdp, value);     return;
      case 0b00110001: if(LM80C_64K == 1) tms9928_register_write(&vdp, value); return;
      case 0b00110010: if(LM80C_64K == 0) tms9928_register_write(&vdp, value); return;

      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: psg_write(port, value); return;

      case 0x50:
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57: cf_write(port, value); return;

      case 0xFF: led_write(port, value); return;

      //default:
         //console.warn(`write on unknown port ${hex(port)}h value ${hex(value)}h`);
   }
}


