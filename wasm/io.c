#include "lm80c.h"
#include "tms9928.h"


byte led_read(byte port)  {
   return EM_ASM_INT({ return led_read(); }, 0);
}

void led_write(byte port, byte value) {
   byte unused = (byte) EM_ASM_INT({ led_write($0); }, value);
}

extern tms9928_t vdp;

EMSCRIPTEN_KEEPALIVE
byte io_read(word ioport) {
   byte port = ioport & 0xFF;

   switch(port) {
      case 0x00: return 0x00;  // PIO not implemented yet
      case 0x01: return 0x00;  // PIO not implemented yet
      case 0x02: return 0x00;  // PIO not implemented yet
      case 0x03: return 0x00;  // PIO not implemented yet

      case 0x10:
      case 0x11:
      case 0x12:
      case 0x13: return ctc_read(port & 3);  // CTC

      case 0x20: return SIO_readPortDA();    // SIO_DA
      case 0x21: return SIO_readPortDB();    // SIO_DB
      case 0x22: return SIO_readPortCA();    // SIO_CA
      case 0x23: return SIO_readPortCB();    // SIO_CB

      case 0x030:  return tms9928_vram_read(&vdp);
      case 0x031:  return tms9928_register_read(&vdp);
      case 0x032:  return tms9928_vram_read(&vdp);
      case 0x033:  return tms9928_register_read(&vdp);

      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: return psg_read(port);

      case 0xFF: return led_read(port);

      default:
         //console.warn(`read from unknown port ${hex(port)}h`);
         return port; // checked on the real HW
   }
 }

EMSCRIPTEN_KEEPALIVE
void io_write(word port, byte value) {

   // console.log(`io write ${hex(port)} ${hex(value)}`)
   switch(port & 0xFF) {
      // PIO DATAREGA
      case 0x00: return;
      case 0x01: return;
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
      case 0b00110010: tms9928_register_write(&vdp, value); return;

      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: psg_write(port, value); return;

      case 0xFF: led_write(port, value); return;

      //default:
         //console.warn(`write on unknown port ${hex(port)}h value ${hex(value)}h`);
   }
}


