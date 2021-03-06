#include <emscripten/emscripten.h>

#define CHIPS_IMPL

#include "chips/z80.h"

//void sio_cpu_found_RETI() { /*byte unused = (byte) EM_ASM_INT({ sio.cpu_found_RETI();  }, 0);*/ }

z80_t cpu;
z80_desc_t desc;

// manually disable CTC from JavaScript
// TODO remove
bool ctc_enabled = true;

EMSCRIPTEN_KEEPALIVE
void lm80c_ctc_enable(bool v) { ctc_enabled = v; }

byte INT_vector;
bool INT_from_SIO = false;

extern int SIO_busy;

uint64_t tick(int num_ticks, uint64_t pins, void* user_data) {

   if(int_NMI) pins |= Z80_NMI;
   else        pins &= ~Z80_NMI;

   if(sio_ticks(num_ticks)) {
      INT_from_SIO = true;
      pins |= Z80_INT;
   }

   if(!SIO_busy && ctc_enabled) {
      if(ctc_ticks(num_ticks)) {
         INT_from_SIO = false;
         pins |= Z80_INT;
      }
   }

   if((pins & Z80_M1) && (pins & Z80_IORQ)) {
      // acknowledge interrupt - this is done by external chip
      if(INT_from_SIO) INT_vector = sio_int_ack_vector();
      else             INT_vector = ctc_int_ack_vector();
      Z80_SET_DATA(pins, INT_vector);
      pins &= ~Z80_INT;
   }
   else if(pins & Z80_MREQ) {
      if(pins & Z80_RD) {
         uint8_t data = mem_read(Z80_GET_ADDR(pins));
         Z80_SET_DATA(pins, data);         
      }
      else if(pins & Z80_WR) {         
         mem_write(Z80_GET_ADDR(pins), Z80_GET_DATA(pins));
      }
   }
   else if(pins & Z80_IORQ) {
      if(pins & Z80_RD) {
         uint8_t data = io_read(Z80_GET_ADDR(pins));
         Z80_SET_DATA(pins, data);         
      }
      else if(pins & Z80_WR) {         
         io_write(Z80_GET_ADDR(pins), Z80_GET_DATA(pins));
      }
   }

   // if RETI is found use the virtual pin to ack other chips
   if(pins & Z80_RETI) {
      ctc_set_reti();
      SIO_cpu_found_RETI();
   }

   return pins;
}

EMSCRIPTEN_KEEPALIVE
void cpu_init() {
   desc.tick_cb = tick;
   desc.user_data = 0;
   z80_init(&cpu, &desc);
}

EMSCRIPTEN_KEEPALIVE
void cpu_reset() {
   z80_reset(&cpu);
}

EMSCRIPTEN_KEEPALIVE uint8_t get_z80_a()         { return z80_a(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_f()         { return z80_f(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_l()         { return z80_l(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_h()         { return z80_h(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_e()         { return z80_e(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_d()         { return z80_d(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_c()         { return z80_c(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_b()         { return z80_b(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_fa()       { return z80_fa(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_af()       { return z80_af(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_hl()       { return z80_hl(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_de()       { return z80_de(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_bc()       { return z80_bc(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_fa_()      { return z80_fa_(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_af_()      { return z80_af_(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_hl_()      { return z80_hl_(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_de_()      { return z80_de_(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_bc_()      { return z80_bc_(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_sp()       { return z80_sp(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_iy()       { return z80_iy(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_ix()       { return z80_ix(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_wz()       { return z80_wz(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_pc()       { return z80_pc(&cpu); }
EMSCRIPTEN_KEEPALIVE uint16_t get_z80_ir()       { return z80_ir(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_i()         { return z80_i(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_r()         { return z80_r(&cpu); }
EMSCRIPTEN_KEEPALIVE uint8_t get_z80_im()        { return z80_im(&cpu); }
EMSCRIPTEN_KEEPALIVE bool get_z80_iff1()         { return z80_iff1(&cpu); }
EMSCRIPTEN_KEEPALIVE bool get_z80_iff2()         { return z80_iff2(&cpu); }
EMSCRIPTEN_KEEPALIVE bool get_z80_ei_pending()   { return z80_ei_pending(&cpu); }

EMSCRIPTEN_KEEPALIVE void set_z80_a(uint8_t v)         { z80_set_a(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_f(uint8_t v)         { z80_set_f(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_l(uint8_t v)         { z80_set_l(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_h(uint8_t v)         { z80_set_h(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_e(uint8_t v)         { z80_set_e(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_d(uint8_t v)         { z80_set_d(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_c(uint8_t v)         { z80_set_c(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_b(uint8_t v)         { z80_set_b(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_af(uint16_t v)       { z80_set_af(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_fa(uint16_t v)       { z80_set_fa(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_hl(uint16_t v)       { z80_set_hl(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_de(uint16_t v)       { z80_set_de(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_bc(uint16_t v)       { z80_set_bc(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_fa_(uint16_t v)      { z80_set_fa_(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_af_(uint16_t v)      { z80_set_af_(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_hl_(uint16_t v)      { z80_set_hl_(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_de_(uint16_t v)      { z80_set_de_(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_bc_(uint16_t v)      { z80_set_bc_(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_sp(uint16_t v)       { z80_set_sp(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_iy(uint16_t v)       { z80_set_iy(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_ix(uint16_t v)       { z80_set_ix(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_wz(uint16_t v)       { z80_set_wz(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_pc(uint16_t v)       { z80_set_pc(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_ir(uint16_t v)       { z80_set_ir(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_i(uint8_t v)         { z80_set_i(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_r(uint8_t v)         { z80_set_r(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_im(uint8_t v)        { z80_set_im(&cpu, v); }
EMSCRIPTEN_KEEPALIVE void set_z80_iff1(bool b)         { z80_set_iff1(&cpu, b); }
EMSCRIPTEN_KEEPALIVE void set_z80_iff2(bool b)         { z80_set_iff2(&cpu, b); }
EMSCRIPTEN_KEEPALIVE void set_z80_ei_pending(bool b)   { z80_set_ei_pending(&cpu, b); }
