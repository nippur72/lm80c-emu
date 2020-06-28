#include "lm80c.h"

#include "keyboard.c"
#include "ctc.c"
#include "sio.c"
#include "psg.c"
#include "mem.c"
#include "io.c"
#include "vdp.c"
#include "cpu.c"


bool debug = false;

void debugBefore() { byte unused = (byte) EM_ASM_INT({ if(debugBefore!== undefined) debugBefore(); }, 0); }
void debugAfter()  { byte unused = (byte) EM_ASM_INT({ if(debugAfter !== undefined) debugAfter();  }, 0); }

EMSCRIPTEN_KEEPALIVE
void lm80c_set_debug(bool v) { debug = v; }


EMSCRIPTEN_KEEPALIVE
uint16_t lm80c_tick() {
   static bool opdone;

   if(debug & opdone) {
      opdone = false;
      debugBefore();
   }

   uint16_t ticks = z80_exec(&cpu, 1);

   if(debug & z80_opdone(&cpu)) {
      debugAfter();
      opdone = true;
   }

   psg_ticks(ticks);

   return ticks;
}

EMSCRIPTEN_KEEPALIVE
uint16_t lm80c_tick_line(float cyclesPerLine) {
   static float counter = 0;

   uint16_t elapsed = 0;
   uint16_t ticks = 0;

   while(true) {
      ticks = lm80c_tick();
      elapsed += ticks;
      counter += (float) ticks;
      if(counter>=cyclesPerLine) {
         counter-=cyclesPerLine;
         break;
      }
   }

   tms9928_drawline(&vdp);

   if(vdp_triggered_NMI) {
      cpu_interrupt(true, 0);
      vdp_triggered_NMI = false;
   }

   return elapsed;
}

EMSCRIPTEN_KEEPALIVE
void lm80c_init() {
   vdp_init();
}

EMSCRIPTEN_KEEPALIVE
void lm80c_reset() {

}

