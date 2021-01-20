let modem_send_to_ws = undefined;
let modem_close = undefined;

let modem_transmit_buffer = [];
let modem_receive_buffer = [];
let modem_received_data = undefined;

//************************************************************

let wstcp_address = "wss://bbs.sblendorio.eu:8080";

function bbs() {
   let ws_connection = new WebSocket(wstcp_address, 'bbs');

   ws_connection.onerror = function(err) {
      console.log('BBS: connection error');
      printm(`${new Date().toLocaleTimeString()} ERROR CONNECTING TO WEBSOCKET\r`);
   };

   ws_connection.onopen = function() {
      console.log('BBS: connected');
      printm(`${new Date().toLocaleTimeString()} CONNECTED\r`);
   };

   ws_connection.onclose = function() {
      console.log('BBS: disconnected');
      modem_send_to_ws = undefined;
   };

   ws_connection.onmessage = async function(e) {
      if (typeof e.data === 'string') {
         console.log("Received string: '" + e.data + "'");
      }
      else {
         // note: this fails on FireFox 83 due to Blob.arrayBuffer()
         // promise: the "await" results in bytes decoded
         // but with wrong timestamp order. Solved with patch-arrayBuffer.js
         let data = await e.data.arrayBuffer();
         let bytes = new Uint8Array(data);
         bytes.forEach(e=>modem_receive_buffer.push(e));
         if(modem_received_data !== undefined) modem_received_data();
      }
   };

   modem_send_to_ws = (data) => {
      let bytes = new Uint8Array(data);
      if(ws_connection.readyState === ws_connection.OPEN) {
         //console.log(`transmitting ${bytes.length} bytes`);
         ws_connection.send(bytes);
      }
      else {
         console.log("BBS: can't send, BBS is disconnected");
      }
   };

   modem_close = ()=> ws_connection.close();
}

function string2Array(str) {
   let arr = [];

   for(let t=0; t<str.length; t++)
      arr.push(str.charCodeAt(t) & 0xFF);

   return new Uint8Array(arr);
}

function array2String(data) {
   let str = "";

   for(var index=0; index<data.length; index++)
      str += String.fromCharCode(data[index]);

   return str;
}

function printm(msg) {
   let data = string2Array(msg);
   data.forEach(e=>modem_receive_buffer.push(e));
}

function send_byte_to_modem(data) {
   modem_transmit_buffer.push(data);
   if(modem_send_to_ws != undefined) {
      modem_send_to_ws(modem_transmit_buffer);
      modem_transmit_buffer = [];
   }
   else {
      bbs();
   }
}

function get_byte_from_modem() {
   if(modem_receive_buffer.length == 0) {
      return 0;
   }
   else {
      let byte = modem_receive_buffer[0];
      modem_receive_buffer = modem_receive_buffer.slice(1);
      return byte;
   }
}

function get_modem_buffer_empty() {
   if(modem_receive_buffer.length == 0) return true;
   else return false;
}

function get_modem_status() {
   if(modem_send_to_ws == undefined) return 2;
   else return 0;
}

modem_received_data = ()=> {
   while(!get_modem_buffer_empty()) {
      let c = get_byte_from_modem();
      SIO_receiveChar(c);
   }
}
