class SIO {
   constructor() {
      this.A = 0;
      this.B = 0;      
   }

   receiveChar(c) {
      this.A = c;
      cpu.interrupt(false, 0xC);
   }

   readPortCA() { return 0x00; }
   readPortDA() { this.A & FF; }
   readPortCB() { return 0x00; }
   readPortDB() { this.B & FF; }

   writePortCA(value) {  }
   writePortDA(value) { this.A = value; }
   writePortCB(value) {  }
   writePortDB(value) { this.B = value; }
}

