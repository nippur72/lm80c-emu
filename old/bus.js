/*
function mem_read(address) {
   if(address < 32768) return rom[address];
   else return ram[address-32768];
}

function mem_write(address, value) {
   if(address < 32768) return;
   else ram[address-32768] = value;
}
*/

/*
function io_read(ioport) {  
   const port = ioport & 0xFF;


   //if(port ===  0b00110000 || port === 0b00110010) {
   //   if(total_cycles - last_vdp_op < 31) {
   //      console.log(`vpd timings ${total_cycles - last_vdp_op} at PC=${hex(cpu.getState().pc,4)}`);
   //   }
   //   last_vdp_op = total_cycles;
   //}


   switch(port) {
      case 0x00: return 0x00;  // PIO
      case 0x01: return 0x00;  // PIO
      case 0x02: return 0x00;  // PIO
      case 0x03: return 0x00;  // PIO      

      case 0x10: 
      case 0x11: 
      case 0x12: 
      case 0x13: return ctc_read(port & 3);  // CTC

      case 0x20: return sio.readPortDA();  // SIO_DA
      case 0x21: return sio.readPortDB();  // SIO_DB
      case 0x22: return sio.readPortCA();  // SIO_CA
      case 0x23: return sio.readPortCB();  // SIO_CB

      case 0x030:  return tms9928a.vram_read();
      case 0x031:  return tms9928a.register_read();
      case 0x032:  return tms9928a.vram_read();
      case 0x033:  return tms9928a.register_read();

      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: return psg_read(port);

     default:
         console.warn(`read from unknown port ${hex(port)}h`);
         return port; // checked on the real HW
   }
}

let last_vdp_op = 0;

function io_write(port, value) {

   // if(port ===  0b00110000 || port === 0b00110010) {
   //    if(total_cycles - last_vdp_op < 31) {
   //       console.log(`vpd timings ${total_cycles - last_vdp_op} at PC=${hex(cpu.getState().pc,4)}`);
   //    }
   //    last_vdp_op = total_cycles;
   // }

   // console.log(`io write ${hex(port)} ${hex(value)}`)
   switch(port & 0xFF) {
      // PIO DATAREGA
      case 0x00: return;
      case 0x01: return;
      case 0x02: return;
      case 0x03: return;

      case 0x10: 
      case 0x11: 
      case 0x12: 
      case 0x13: ctc_write(port & 3, value); return;

      // SIO 0x20-23
      case 0x20: sio.writePortDA(value); return; // SIO_DA equ %00100000
      case 0x21: sio.writePortDB(value); return; // SIO_DB equ %00100001
      case 0x22: sio.writePortCA(value); return; // SIO_CA equ %00100010
      case 0x23: sio.writePortCB(value); return; // SIO_CB equ %00100011

      // TMS9918: 0x30-0x33   
      case 0b00110000: tms9928a.vram_write(value);     return;
      case 0b00110010: tms9928a.register_write(value); return;
     
      case 0x40:
      case 0x41:
      case 0x42:
      case 0x43: psg_write(port, value); return;

      default:
         console.warn(`write on unknown port ${hex(port)}h value ${hex(value)}h`);
   }   
}
*/
