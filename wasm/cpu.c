/*
 * Copyright 2011 The Emscripten Authors.  All rights reserved.
 * Emscripten is available under two separate licenses, the MIT license and the
 * University of Illinois/NCSA Open Source License.  Both these licenses can be
 * found in the LICENSE file.
 */


#include <emscripten/emscripten.h>

#define CHIPS_IMPL

//#include "z80.h"
//#include "mc6847.h"

/*
z80_t cpu;
z80_desc_t desc;

bool interrupt_pending;      // an interrupt is pending 
bool interrupt_pending_nmi;  // was it a NMI or INT ?
uint8_t interrupt_data;      // data byte to push on the D7-D0

uint64_t tick(int num_ticks, uint64_t pins, void* user_data) {
   if((pins & Z80_M1) && (pins & Z80_IORQ)) {
      // acknowledge interrupt - this is done by external chip
      Z80_SET_DATA(pins, interrupt_data);
      interrupt_pending = false;
      pins &= ~Z80_NMI;
      pins &= ~Z80_INT;
   }
   else if(pins & Z80_MREQ) {
      if(pins & Z80_RD) {
         uint8_t data = (uint8_t) EM_ASM_INT({ return mem_read($0); }, Z80_GET_ADDR(pins));                  
         Z80_SET_DATA(pins, data);         
      }
      else if(pins & Z80_WR) {         
         EM_ASM({ mem_write($0,$1) }, Z80_GET_ADDR(pins), Z80_GET_DATA(pins));
      }
   }
   else if(pins & Z80_IORQ) {
      if(pins & Z80_RD) {
         uint8_t data = EM_ASM_INT({ return io_read($0); }, Z80_GET_ADDR(pins));         
         Z80_SET_DATA(pins, data);         
      }
      else if(pins & Z80_WR) {         
         EM_ASM({ io_write($0,$1) }, Z80_GET_ADDR(pins), Z80_GET_DATA(pins));
      }
   }

   if(interrupt_pending) {
      if(interrupt_pending_nmi) pins |= Z80_NMI;
      else                      pins |= Z80_INT;
   }

   ////else if(interrupt_pending && (pins & Z80_M1) && (pins & Z80_IORQ))
   ////{
   ////   // acknowledge interrupt - this is done by external chip
   ////   Z80_SET_DATA(pins, interrupt_data);
   ////   interrupt_pending = false;
   ////}
   //
   //if(interrupt_pending) {
   //   if(interrupt_pending_nmi) pins |= Z80_NMI;
   //   else                      pins |= Z80_INT;
   //   interrupt_pending = false;
   //}
   //
   ////else
   ////{
   ////   // does they need to be cleared? pins &= ~Z80_NMI;
   ////   pins &= ~Z80_NMI;
   ////   pins &= ~Z80_INT;
   ////}
 
   return pins;
}

EMSCRIPTEN_KEEPALIVE
void init() {
   desc.tick_cb = tick;
   desc.user_data = 0;  
   interrupt_pending = false;
   z80_init(&cpu, &desc);
}

EMSCRIPTEN_KEEPALIVE
void reset() {      
   z80_reset(&cpu);
}

EMSCRIPTEN_KEEPALIVE
uint16_t run_instruction() {
   uint16_t ticks = 0;   
   do ticks+=z80_exec(&cpu, 1);   
   while(!z80_opdone(&cpu));
   return ticks;
}

EMSCRIPTEN_KEEPALIVE
void interrupt(bool nmi, uint8_t data) {
   interrupt_pending = true;
   interrupt_pending_nmi = nmi;
   interrupt_data = data;
   // all this is handled in the next cpu tick
}

EMSCRIPTEN_KEEPALIVE
uint16_t get_pc() {          
   return z80_pc(&cpu);
}
*/

/*
uint16_t state[32];

EMSCRIPTEN_KEEPALIVE
uint16_t getState() {
   return state;
}
*/
/*
// setState
EMSCRIPTEN_KEEPALIVE
void setState(uint16_t *s) {

}
*/

/***************************** MC6847 EMULATION **********************************/

/*
#define VBUFSIZE 320*244*4

mc6847_desc_t vdesc;
mc6847_t vdg;

uint32_t vbuffer[VBUFSIZE];
uint64_t vfetch_cb(uint64_t pins, void *user_data) {
   return 65;
}

EMSCRIPTEN_KEEPALIVE
void vinit() {
   vdesc.tick_hz = 3560000;
   vdesc.rgba8_buffer = vbuffer;
   vdesc.rgba8_buffer_size = VBUFSIZE;
   vdesc.fetch_cb = vfetch_cb;
   vdesc.user_data = 0;
   mc6847_init(&vdg,&vdesc);
}

EMSCRIPTEN_KEEPALIVE
void vreset() {
   mc6847_reset(&vdg);
}
*/
