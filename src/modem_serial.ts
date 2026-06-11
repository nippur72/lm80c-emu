import { SIO_receiveChar } from './emscripten_wrapper';

// this function overrides the normal serial behaviour
// attaching to it a virtual modem connected to the BBS

function start_bbs() {
   // create the virtual modem
   let modem = new VirtualModem();

   // redirects received characters to SIO
   modem.onreceive = () => {
      while(modem.read_status() != 0) {
         SIO_receiveChar(modem.read_byte());
      }
   }

   // this is the function called when the CPU does I/O on the serial port
   // redirects the data to the virtual modem
   (window as any).sio_write_data = (port: number, data: number[]) =>  {
      data.forEach(e=>modem.write_byte(e));
   }

   modem.connect();
}

export { start_bbs };
