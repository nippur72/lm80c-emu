function mem_read(address) {   
   if(address<32768) return rom[address];
   else return ram[address-32768];
}

function mem_write(address, value) {
   if(address<32768) return rom[address] = value;
   else ram[address-32768] = value;
}

function io_read(ioport) {  
   const port = ioport & 0xFF;
   switch(port) {

      case 0x10: return ctc.read(port & 3);  // CTC
      case 0x11: return ctc.read(port & 3);  // CTC
      case 0x12: return ctc.read(port & 3);  // CTC
      case 0x13: return ctc.read(port & 3);  // CTC

      case 0x20: return sio.readPortDA();  // SIO_DA equ %00100000
      case 0x21: return sio.readPortDB();  // SIO_DB equ %00100001
      case 0x22: return sio.readPortCA();  // SIO_CA equ %00100010
      case 0x23: return sio.readPortCB();  // SIO_CB equ %00100011      
      
      // tms9918 0x30-0x33
      /*
      // old tms
      case 0b00110000:  return tms.lePortaDados();
      case 0b00110010:  return tms.lePortaComandos();
      */
      case 0b00110000:  return tms9928a.vram_read();
      case 0b00110010:  return tms9928a.register_read();

      // psg 0x40-0x43   
      //case 0x40:         
      //   return psg.read;

      case 0x40:         
         return psg.readDataPort();

      default:
         console.warn(`read from unknown port ${hex(port)}h`);
         return 0xFF; // TODO what does it in the real HW
   }
}

function io_write(port, value) { 
   // console.log(`io write ${hex(port)} ${hex(value)}`)  
   switch(port & 0xFF) {
      // PIO DATAREGA
      case 0x01:
         // TODO implement
         return;

      // PIO DATAREGB
      case 0x01:
         // TODO implement
         return;

      // PIO CTRLREGA
      case 0x02:
         // TODO implement
         return;

         // PIO CTRLREGA
      case 0x03:
         // TODO implement
         return;

      // CTC CH0-3
      case 0x10: ctc.write(port & 3, value); return;
      case 0x11: ctc.write(port & 3, value); return;
      case 0x12: ctc.write(port & 3, value); return;
      case 0x13: ctc.write(port & 3, value); return;

      // SIO 0x20-23
      case 0x20: sio.writePortDA(value); return; // SIO_DA equ %00100000
      case 0x21: sio.writePortDB(value); return; // SIO_DB equ %00100001
      case 0x22: sio.writePortCA(value); return; // SIO_CA equ %00100010
      case 0x23: sio.writePortCB(value); return; // SIO_CB equ %00100011

      // TMS9918: 0x30-0x33   
      case 0b00110000:
         // old tms.escrevePortaDados(value);
         tms9928a.vram_write(value);
         break;

      case 0b00110010:
         // old tms.escrevePortaComandos(value);
         tms9928a.register_write(value);
         break;
         
      // psg 0x40-0x43   
      case 0x40:
         psg.writeRegPort(value);
         return;

      case 0x41:         
         psg.writeDataPort(value);
         return;
                     
      default:
         console.warn(`write on unknown port ${hex(port)}h value ${hex(value)}h`);
   }   
}
