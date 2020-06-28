#include <emscripten/emscripten.h>

#define CHIPS_IMPL

#include "chips/z80ctc.h"

z80ctc_t ctc;

extern bool SIO_busy;

EMSCRIPTEN_KEEPALIVE
void ctc_init() {
   z80ctc_init(&ctc);
}

EMSCRIPTEN_KEEPALIVE
void ctc_reset() {
   z80ctc_reset(&ctc);
}

EMSCRIPTEN_KEEPALIVE
void ctc_set_reti() {
  uint64_t pins = Z80CTC_RETI|Z80CTC_IEIO;
  pins = z80ctc_int(&ctc, pins);
}

EMSCRIPTEN_KEEPALIVE
uint8_t ctc_int_ack() {
  uint64_t pins = Z80CTC_IORQ|Z80CTC_M1|Z80CTC_IEIO;
  pins = z80ctc_int(&ctc, pins);
  return Z80CTC_GET_DATA(pins);
}

EMSCRIPTEN_KEEPALIVE
uint8_t ctc_ticks(int ticks) {
   uint64_t pins = SIO_busy ? 0 : Z80CTC_IEIO;
   int interrupt_requested = 0;
   for(int t=0; t<ticks; t++) {
      pins = z80ctc_tick(&ctc, pins);
      pins = z80ctc_int(&ctc, pins);
      interrupt_requested |= ((pins & Z80CTC_INT) != 0);
   }
   return interrupt_requested;
}

EMSCRIPTEN_KEEPALIVE
uint8_t ctc_read(uint8_t port) {
   uint64_t pins = Z80CTC_IORQ|Z80CTC_CE|Z80CTC_RD | (port & 3);
   pins = z80ctc_iorq(&ctc, pins);
   return Z80CTC_GET_DATA(pins);
}

EMSCRIPTEN_KEEPALIVE
void ctc_write(uint8_t port, uint8_t data) {   
   uint64_t cs = (port & 3) * Z80CTC_CS0;
   uint64_t pins = Z80CTC_IORQ|Z80CTC_CE | cs;
   Z80CTC_SET_DATA(pins, data);
   pins = z80ctc_iorq(&ctc, pins);   
}


