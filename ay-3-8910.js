class psg8910 {
   constructor() {
      this.current_register = 0;
      this.registers = new Uint8Array(16).fill(0);   
      this.IO_PORT_A_ENABLED = 0;
      this.IO_PORT_B_ENABLED = 0;
      this.count = 0;
    }
 
   writeDataPort(i) {
      this.registers[this.current_register] = i;
   }
 
   writeRegPort(i) {     
     this.current_register = i & 0xF;
   }
 
   readDataPort() {     
     this.IO_PORT_A_ENABLED = (this.registers[7] >> 6) & 1;
     this.IO_PORT_B_ENABLED = (this.registers[7] >> 7) & 1;

     let A = this.registers[14];
     let B = this.registers[15];        

     if(this.current_register === 15) 
     {
         if(this.IO_PORT_A_ENABLED && !this.IO_PORT_B_ENABLED) 
         {
            B = keyboard_poll(A);
            return B;
         }
     }
     else return this.registers[this.current_register];     
   }

   dump() {
      this.count++;
      if(this.count < 50)
      console.log(`A=${this.registers[14]} ${this.IO_PORT_A_ENABLED} B=${this.registers[15]} ${this.IO_PORT_B_ENABLED}`);
   }
 }
 