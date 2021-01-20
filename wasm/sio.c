#include "lm80c.h"

#define SIO_BUFFERSIZE 4096
byte receive_buffer_A[SIO_BUFFERSIZE];
int  receive_buffer_A_len = 0;
byte receive_buffer_B[SIO_BUFFERSIZE];
int  receive_buffer_B_len = 0;

byte SIO_port_A_data    = 0;     // port A data register value
byte SIO_port_B_data    = 0;     // port B data register value
byte SIO_port_A_status  = 0x01;  // port A status register value
byte SIO_port_B_status  = 0x01;  // port B status register value

int SIO_INT = 0;         // interrupt pin: is set to 1 during all the SIO interrupt time, from trigger to M1 & IORQ (ACK)
int SIO_busy = 0;        // 1=SIO is busy serving the interrupt: from trigger to RETI

// TODO callbacks for IEI and IEO
int SIO_IEI_cb = 0;      // Interrupt Enable Input: callback to ask if interrupt line is free, (returns always 0 for now)

// *************************************************************************************
// called from CPU tick, to ask for the SIO interrupt ACK vector data byte
// clears the INT pin
// *************************************************************************************
uint8_t sio_int_ack_vector() {
   SIO_INT = 0;
   return 0x0C;
}

// *************************************************************************************
// ticks the SIO
// returns the SIO INT pin status
// *************************************************************************************
int sio_tick_counter = 0;
uint8_t sio_ticks(int ticks) {
   if(SIO_INT == 1) return SIO_INT;

   if(receive_buffer_A_len == 0) return SIO_INT;

   sio_tick_counter += ticks;
   if(sio_tick_counter > 25000) {
      sio_tick_counter = 0;
      // pop character
      byte data = receive_buffer_A[0];
      for(int t=1;t<receive_buffer_A_len;t++) receive_buffer_A[t-1] = receive_buffer_A[t];
      receive_buffer_A_len--;
      SIO_port_A_data = data;
      SIO_INT = 1;
      SIO_busy = 1;
   }

   return SIO_INT;
}

// *************************************************************************************
// called from CPU tick when the RETI instruction is found
// ends the interrupt on the SIO
// *************************************************************************************
void SIO_cpu_found_RETI() {
    if(SIO_INT && SIO_IEI_cb == 0) {
        SIO_busy = 0;
    }
}

byte SIO_readPortCA() { return SIO_port_A_status; }
byte SIO_readPortDA() { return SIO_port_A_data;   }
byte SIO_readPortCB() { return SIO_port_B_status; }
byte SIO_readPortDB() { return SIO_port_B_data;   }

void SIO_writePortCA(byte value) {
    byte unused = (byte) EM_ASM_INT({ sio_write_control($0, $1);}, 0, value);
}

void SIO_writePortCB(byte value) {
    byte unused = (byte) EM_ASM_INT({ sio_write_control($0, $1);}, 0, value);
}

void SIO_writePortDA(byte value) {
    SIO_port_A_data = value;
    // sends the data byte to the external world
    byte unused = (byte) EM_ASM_INT({ sio_write_data($0, $1);}, 0, value);
}

void SIO_writePortDB(byte value) {
    SIO_port_B_data = value;
    // sends the data byte to the external world
    byte unused = (byte) EM_ASM_INT({ sio_write_data($0, $1);}, 1, value);
}

// *************************************************************************************
// EXTERNAL INTERFACE
// *************************************************************************************

EMSCRIPTEN_KEEPALIVE
void SIO_receiveChar(byte c) {
    if(receive_buffer_A_len < SIO_BUFFERSIZE-1) {
        receive_buffer_A[receive_buffer_A_len] = c;
        receive_buffer_A_len++;
    }
    else {
        // TODO trigger buffer overflow
        // do nothing for now
    }
}
