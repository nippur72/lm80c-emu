class SIO {
   constructor() {
      this.A = 0;
      this.B = 0;      
   }

   receiveChar(c) {
      this.A = c;
      cpu.interrupt(false, 0xC);
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
      //console.log(`CA write 0x${hex(value)} -- ${bin(value)}`); 
   }
   writePortDA(value) { 
      //console.log(`DA write 0x${hex(value)} -- ${bin(value)}`); 
      this.A = value; 
   }
   writePortCB(value) { c
      //console.log(`CB write 0x${hex(value)} -- ${bin(value)}`); 
   }
   writePortDB(value) { 
      //console.log(`DB write 0x${hex(value)} -- ${bin(value)}`); 
      this.B = value; 
   }
}

