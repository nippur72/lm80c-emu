// old psg with keyboard only

/*
class psg8910 {
   constructor() {
      this.current_register = 0;
      this.registers = new Uint8Array(16).fill(0);   
      this.IO_PORT_A_ENABLED = 0;
      this.IO_PORT_B_ENABLED = 0;
      this.count = 0;
   }

   write(port, data) {
      //psg_write(port, data);

      if((port & 1) === 0) this.latch(data);     // latch:          A0=0, WR=1
      else                 this.writeReg(data);  // write register: A0=1, WR=1
   }

   read(port) {
      //return psg_read(port);

      if((port & 1) === 0) {
         //return psg_read(port);
         return this.readDataPort();
      }
      else {
         // inactive
         return 0x00;
      }
   }

   latch(data) {
      this.current_register = data & 0xF;
   }

   writeReg(value) {
      this.registers[this.current_register] = value;
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
      return this.registers[this.current_register];

      return 0x00;

      console.log("read 0x40");
      return psg_read(0x40);
   }

   dump() {
      this.count++;
      if(this.count < 50)
      console.log(`A=${this.registers[14]} ${this.IO_PORT_A_ENABLED} B=${this.registers[15]} ${this.IO_PORT_B_ENABLED}`);
   }
 }
 */