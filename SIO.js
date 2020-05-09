class SIO {

   busy = false;

   IEI_cb = undefined;      // callback to ask if interrupt line is free

   constructor() {
      this.A = 0;
      this.B = 0;
   }

   IEO() {
      if(this.busy) return 0;  // busy
      else          return 1;  // not busy, ENABLE
   }

   receiveChar(c) {
      this.A = c;
      this.trigger();
   }

   trigger() {
      if(this.IEI_cb !== undefined && this.IEI_cb() === 0) {
         console.log(`${total_cycles} SIO: can't trigger, INT line is occupied chained device`);
         return;
      }

      if(this.busy) {
         console.log(`${total_cycles} SIO: can't trigger, previous INT call not finshed`);
         return;
      }

      this.busy = true;
      cpu.interrupt(false, 0xC);
      //console.log(`${total_cycles} SIO: interrupt started`);
   }

   cpu_found_RETI() {
      if(this.busy && this.IEI_cb() == 1) {
         this.busy = false;
         //console.log(`${total_cycles} SIO: interrupt ended`);
      }
   }

   readPortCA() {
      //console.log("CA read");
      return 0x00; /*return this.A & FF;*/
   }
   readPortDA() {
      //console.log("DA read");
      return this.A & 0xFF;
   }
   readPortCB() { 
      //console.log("CB read");
      return 0x00; /* return this.A & FF;*/ 
   }
   readPortDB() { 
      //console.log("DB read");
      return this.B & 0xFF; 
   }

   writePortCA(value) {
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
   writePortDA(value) { 
      //console.log(`DA write 0x${hex(value)} -- ${bin(value)}`);
      this.A = value; 
   }
   writePortCB(value) {
      //console.log(`CB write 0x${hex(value)} -- ${bin(value)}`);
   }
   writePortDB(value) { 
      //console.log(`DB write 0x${hex(value)} -- ${bin(value)}`);
      this.B = value; 
   }
}

