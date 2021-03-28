// this function overrides the normal serial behaviour
// attachint to it a virtual modem connected to the BBS

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
   // redirects the data to the virtual modedm
   sio_write_data = (port, data) =>  {
      data.forEach(e=>modem.write_byte(e));
   }

   modem.connect();
}
