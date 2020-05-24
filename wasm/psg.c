#include <emscripten/emscripten.h>

#define CHIPS_IMPL

#include "chips/ay38910.h"

ay38910_t ay38910;
ay38910_desc_t ay38910_desc;
uint8_t portB;

uint8_t ay38910_port_in_cb(int port_id, void* user_data)
{
   // uint8_t risp = (uint8_t) EM_ASM_INT({ console.log("in_cb",$0); return 0; }, port_id);

   if(port_id == AY38910_PORT_A) {
      uint8_t data = (uint8_t) EM_ASM_INT({ return keyboard_poll($0); }, portB);
      return data; // keyboard_poll(portB);
   }
   return 0x00;
}

void ay38910_port_out_cb(int port_id, uint8_t data, void* user_data)
{
   if(port_id == AY38910_PORT_B) {
      portB = data;
   }
}

EMSCRIPTEN_KEEPALIVE
void psg_init() {
   // fill the chip description
   ay38910_desc.type = AY38910_TYPE_8910;
   ay38910_desc.tick_hz = 3686400;
   ay38910_desc.sound_hz = 48000;
   ay38910_desc.magnitude = 0.75;
   ay38910_desc.in_cb = ay38910_port_in_cb;
   ay38910_desc.out_cb = ay38910_port_out_cb;
   ay38910_desc.user_data = NULL;

   // initialize the chip
   ay38910_init(&ay38910, &ay38910_desc);

   // and reset it
   ay38910_reset(&ay38910);
}

EMSCRIPTEN_KEEPALIVE
void psg_reset() {
   // and reset it
   ay38910_reset(&ay38910);
}

#define AUDIO_BUFSIZE 4096

float audio_buf[AUDIO_BUFSIZE];
int audio_buf_ptr = 0;

uint64_t psg_tick_counter = 0;

EMSCRIPTEN_KEEPALIVE
void psg_ticks(int ticks) {
   for(int t=0; t<ticks; t++) {
      psg_tick_counter++;
      if((psg_tick_counter & 1) == 0) {
         // tick at half the clock speed
         if(ay38910_tick(&ay38910)) {
            audio_buf[audio_buf_ptr] = ay38910.sample;
            audio_buf_ptr++;
            if(audio_buf_ptr == AUDIO_BUFSIZE) {
               audio_buf_ptr = 0;
               uint8_t risp = (uint8_t) EM_ASM_INT({ return ay38910_audio_buf_ready($0, $1); }, audio_buf, AUDIO_BUFSIZE);
            }
         };
      }
   }
}

EMSCRIPTEN_KEEPALIVE
void psg_write(uint8_t port, uint8_t data) {

   int A0   = port & 1;
   int BC1  = (~A0) & 1;
   int BDIR = 1;

   //uint8_t risp = (uint8_t) EM_ASM_INT({ console.log("wr ",$0, $1); return 0; }, port, data);

   uint64_t pins = 0;

   if(BC1)   pins |= AY38910_BC1;
   if(BDIR)  pins |= AY38910_BDIR;

   AY38910_SET_DATA(pins, data);

   ay38910_iorq(&ay38910, pins);
}

EMSCRIPTEN_KEEPALIVE
uint8_t psg_read(uint8_t port) {

   int A0   = port & 1;
   int BC1  = (~A0) & 1;
   int BDIR = 0;

   uint64_t pins = 0;

   if(BC1)   pins |= AY38910_BC1;
   if(BDIR)  pins |= AY38910_BDIR;

   pins = ay38910_iorq(&ay38910, pins);

   return AY38910_GET_DATA(pins);
}

#define LO(c) ( c & 0xFFFFFFFF)
#define HI(c) ( (c >> 32) & 0xFFFFFFFF)

EMSCRIPTEN_KEEPALIVE
uint64_t psg_generic_io_read(uint8_t BDIR, uint8_t BC1) {

   uint64_t pins = 0;

   if(BC1)   pins = pins | AY38910_BC1;
   if(BDIR)  pins = pins | AY38910_BDIR;

   pins = ay38910_iorq(&ay38910, pins);

   return pins;
}

EMSCRIPTEN_KEEPALIVE
uint64_t psg_generic_io_write(uint8_t BDIR, uint8_t BC1, uint8_t data) {

   uint64_t pins = 0;

   AY38910_SET_DATA(pins, data);

   if(BC1)   pins |= AY38910_BC1;
   if(BDIR)  pins |= AY38910_BDIR;

   pins = ay38910_iorq(&ay38910, pins);

   return pins;
}

EMSCRIPTEN_KEEPALIVE
uint8_t psg_query_reg(int n) {
   return ay38910.reg[n];
}

EMSCRIPTEN_KEEPALIVE
uint64_t psg_query_addr(uint8_t n) {
   return ay38910.addr;
}

/*
#define SOUND_BUFSIZE 2048;
float sound_buffer[SOUND_BUFSIZE];
int sound_buffer_ptr;

EMSCRIPTEN_KEEPALIVE
void psg_ticks(int ticks) {
   for(int t=0; t<ticks; t++) {
      if(ay38910_tick(&ay)) {
         sound_buffer[sound_buffer_ptr++] = ay.sample;
         if(sound_buffer_ptr === SOUND_BUFSIZE) {
            sound_buffer_ptr = 0;
         }
      }
   }
}
*/

EMSCRIPTEN_KEEPALIVE
int test_function() {
   return 42;
}
