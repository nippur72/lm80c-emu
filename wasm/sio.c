#include "lm80c.h"

EMSCRIPTEN_KEEPALIVE void cpu_interrupt(bool nmi, uint8_t data);

int SIO_IEI_cb = 1;      // callback to ask if interrupt line is free, (returns always 1 for now)

byte SIO_port_A = 0;
byte SIO_port_B = 0;
bool SIO_busy = false;

EMSCRIPTEN_KEEPALIVE
uint8_t sio_int_ack() {
  return 0x0C;
}

EMSCRIPTEN_KEEPALIVE
uint8_t sio_ticks(int ticks) {
   if(SIO_busy) return 1;
   else return 0;
}

int SIO_IEO() {
    if(SIO_busy) return 0;  // busy
    else         return 1;  // not busy, ENABLE
}

void SIO_trigger() {
    //if(SIO_IEI_cb === 0) {
    //    //console.log(`${total_cycles} SIO: can't trigger, INT line is occupied chained device`);
    //    //return;
    //}

    //if(SIO_busy) {
    //    console.log(`${total_cycles} SIO: can't trigger, previous INT call not finshed`);
    //    return;
    ///}

    SIO_busy = true;
    // TODO cpu_interrupt(false, 0xC);
    //console.log(`${total_cycles} SIO: interrupt started`);
}

EMSCRIPTEN_KEEPALIVE
bool sio_is_busy() {
    return SIO_busy;
}

EMSCRIPTEN_KEEPALIVE
void SIO_receiveChar(byte c) {
    SIO_port_A = c;
    SIO_trigger();
}

void SIO_cpu_found_RETI() {
    if(SIO_busy && SIO_IEI_cb == 1) {
        SIO_busy = false;
        //console.log(`${total_cycles} SIO: interrupt ended`);
    }
}

byte SIO_readPortCA() {
    //console.log("CA read");
    return 0x01; /*return SIO_port_A & FF;*/
}
byte SIO_readPortDA() {
    //console.log("DA read");
    return SIO_port_A & 0xFF;
}
byte SIO_readPortCB() {
    //console.log("CB read");
    return 0x01; /* return SIO_port_A & FF;*/
}
byte SIO_readPortDB() {
    //console.log("DB read");
    return SIO_port_B;
}

void SIO_writePortCA(byte value) {
    /*
    if(value == 0x2a) {
        // hack
        if(buffer_sio.length > 0) {
        setTimeout(()=>{
            sio.receiveChar(buffer_sio[0]);
            buffer_sio = buffer_sio.slice(1);
        },1000);
        }
    }
    */
    //console.log(`CA write 0x${hex(value)} -- ${bin(value)}`);
}

void SIO_writePortCB(byte value) {
    //console.log(`CB write 0x${hex(value)} -- ${bin(value)}`);
}

void SIO_writePortDA(byte value) {
    //console.log(`DA write 0x${hex(value)} -- ${bin(value)}`);
    byte unused = (byte) EM_ASM_INT({ sio_write_data($0, $1);}, 0, value);
    SIO_port_A = value;
}

void SIO_writePortDB(byte value) {
    byte unused = (byte) EM_ASM_INT({ sio_write_data($0, $1);}, 1, value);
    SIO_port_B = value;
}


