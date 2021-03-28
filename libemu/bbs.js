/* BBS - connect to a WebSocket tunneled BBS

   Basic usage:

      let modem = new BBS();

      modem.onreceive = (data) => {
         console.log(data);
         modem.disconnect();
      }

      await modem.connect();
      modem.sendText("hello");
      modem.send([1,2,3]);
      modem.disconnect();
*/

class BBS {
   constructor() {
      this.connected = false;
      this.ws_connection = undefined;         // the WebSocket connection
      this.onreceive = undefined;             // user defined callback when data is received
   }

   async connect(url, protocol) {
      return new Promise((resolve,reject)=>{
         if(url === undefined) url = "wss://bbs.sblendorio.eu:8080";
         if(protocol === undefined) protocol = "bbs";

         if(this.connected) {
            console.log("BBS: already connected");
            reject("already connected");
         }

         // create the WebSocket connection
         this.ws_connection = new WebSocket(url, protocol);
         this.ws_connection.onerror = (err) => this.onerror(err);
         this.ws_connection.onclose = () => this.onclose();
         this.ws_connection.onmessage = (e) => this.onmessage(e);
         this.ws_connection.onopen = () => {
            this.connected = true;
            resolve("connected");
         }
      });
   }

   onerror(err) {
      console.log('BBS: connection error');
      //this.printm(`${new Date().toLocaleTimeString()} ERROR CONNECTING TO WEBSOCKET\r`);
      this.connected = false;
   }

   onclose() {
      console.log('BBS: disconnected');
      this.connected = false;
   }

   // function called when bytes are received from the WebSocket
   async onmessage(e) {
      if(!this.connected) return;

      if (typeof e.data === 'string') {
         console.log("Received string: '" + e.data + "'");
      }
      else {
         // note: this fails on FireFox 83 due to Blob.arrayBuffer()
         // promise: the "await" results in bytes decoded
         // but with wrong timestamp order. Solved with patch-arrayBuffer.js
         let data = await e.data.arrayBuffer();
         let bytes = new Uint8Array(data);
         if(this.onreceive !== undefined) {
            this.onreceive(bytes);
         }
      }
   }

   send(data) {
      if(!this.connected) {
         console.log("not connected");
         return;
      }

      let bytes = new Uint8Array(data);
      if(this.ws_connection.readyState === this.ws_connection.OPEN) {
         //console.log(`transmitting ${bytes.length} bytes`);
         this.ws_connection.send(bytes);
      }
      else {
         console.log("BBS: can't send, BBS is disconnected");
      }
   }

   sendText(text) {
      this.send(this.string2Array(text));
   }

   disconnect() {
      this.ws_connection.close();
   }

   string2Array(str) {
      let arr = [];
      for(let t=0; t<str.length; t++)
         arr.push(str.charCodeAt(t) & 0xFF);
      return new Uint8Array(arr);
   }

   array2String(data) {
      let str = "";
      for(var index=0; index<data.length; index++)
         str += String.fromCharCode(data[index]);
      return str;
   }
}


