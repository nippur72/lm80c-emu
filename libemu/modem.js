//
// implements a virtual modem mapped on I/O that talks to the BBS
//

class VirtualModem {
   constructor() {
      this.bbs = new BBS();
      this.read_buffer = [];
      this.onreceive = undefined;
   }

   connect() {
      this.bbs.onreceive = (data) => {
         data.forEach((e)=>this.read_buffer.push(e));
         if(this.onreceive !== undefined) this.onreceive();
      }
      this.bbs.connect("ws:localhost:8080","bbs");
   }

   disconnect() {
      this.bbs.disconnect();
   }

   read_status() {
      return this.read_buffer.length > 0;
   }

   write_status() {
      return true;
   }

   read_byte() {
      if(this.read_buffer.length==0) return 0;
      let byte = this.read_buffer[0];
      this.read_buffer = this.read_buffer.slice(1);
      return byte;
   }

   write_byte(data) {
      this.bbs.send(data);
   }
}
