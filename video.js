
let aspect = 1.25;

const TEXT_W = 256;
const TEXT_H = 192;

let BORDER_V_TOP;
let BORDER_V_BOTTOM;
let BORDER_H_LEFT;
let BORDER_H_RIGHT;

let SCREEN_W;
let SCREEN_H;

let saturation = 1.0;

function calculateGeometry() {
   BORDER_V_TOP    = 16;
   BORDER_V_BOTTOM = 16;
   BORDER_H_LEFT   =  8;
   BORDER_H_RIGHT  =  8;
   SCREEN_W = BORDER_H_LEFT + TEXT_W + BORDER_H_RIGHT;
   SCREEN_H = BORDER_V_TOP  + TEXT_H + BORDER_V_BOTTOM;

   // canvas is the outer canvas where the aspect ratio is corrected
   let canvas = document.getElementById("canvas");
   canvas.width  = SCREEN_W * 2;
   canvas.height = SCREEN_H * 2;

   // screen is the inner canvas that contains the emulated PAL screen
   let screenCanvas = document.createElement("canvas");
   screenCanvas.width  = SCREEN_W * 2;
   screenCanvas.height = SCREEN_H * 2;

   //console.log(`${screenCanvas.width} ${screenCanvas.height}`);
}

calculateGeometry();

/**************************************************/

// new TMS9928A
let tms9928a_canvas = document.getElementById("canvas");
let tms9928a_context = tms9928a_canvas.getContext('2d');
let tms9928a_imagedata = tms9928a_context.getImageData(0, 0, 342*2, 262*2);

let tms9928a_buffer = new Uint32Array(342*262);

let tms9928a_update = buffer => {

   /*
   // non doubled pixel render
   let ptr = 0;
   let ptr1 = 0;
   let data = tms9928a_imagedata.data;
   for(let y=0;y<262;y++) {
      for(let x=0;x<342;x++) {
         data[ptr++] = buffer[ptr1] & 0xFF;
         data[ptr++] = (buffer[ptr1] & 0xFF00) >> 8;
         data[ptr++] = (buffer[ptr1] & 0xFF0000) >> 16;
         data[ptr++] = 0xFF;
         ptr1++;
      }
   }
   */

   // "data" is a data view so that RGBA is seen as a fast Uint32Array
   var buf = new ArrayBuffer(tms9928a_imagedata.data.length);
   var buf8 = new Uint8ClampedArray(buf);
   var data = new Uint32Array(buf);

   let ptr = 0;
   let ptr1 = 0;

   for(let y=0;y<262;y++) {
      for(let x=0;x<342;x++) {
         data[ptr++] = buffer[ptr1];
         data[ptr++] = buffer[ptr1];
         ptr1++;
      }
      ptr += 342*2;
   }

   ptr = 342*2;
   ptr1 = 0;

   for(let y=0;y<262;y++) {
      for(let x=0;x<342;x++) {
         data[ptr++] = buffer[ptr1];
         data[ptr++] = buffer[ptr1];
         ptr1++;
      }
      ptr += (342 * 1)*2;
   }

   tms9928a_imagedata.data.set(buf8);
   tms9928a_context.putImageData(tms9928a_imagedata, -60, -48);
};

let VDP_triggered_NMI = false;

let tms9928a_interrupt_cb = (m_INT)=> {
   if(m_INT === 1) VDP_triggered_NMI = true;
};

let tms9928a = new TMS9928A({
   vram_size: 16384,
   isPal: false,
   int_line_cb: tms9928a_interrupt_cb,
   gromclk_cb: undefined,
   buffer: tms9928a_buffer,
   screen_update_cb: undefined,
   family99: true,
   reva: true
});

