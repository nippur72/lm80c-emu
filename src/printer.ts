// simplified printer, it prints to console and it is always ready

let printerBuffer = "";
let printerReady = 0x00;

let printerTimeLastReceived: number = 0;

// this version prints the whole buffer into one console line, allowing copy & paste
// print is done if nothing is received from the computer within 2 seconds
function checkPrinterBuffer() {
   const d = new Date().getTime() - printerTimeLastReceived;
   if(d > 2000 && printerBuffer !== "") {
      console.log(printerBuffer);
      printerBuffer = "";
      return;
   }
   setTimeout(()=>checkPrinterBuffer(), 2000);
}

function printerWrite(byte: number) {
   printerBuffer += String.fromCharCode(byte & 0xFF);
   printerTimeLastReceived = new Date().getTime();
   checkPrinterBuffer();
}

export { printerWrite, printerBuffer, printerReady };
