function calculateGeometry() {
   const BORDER_V_TOP    = 16;
   const BORDER_V_BOTTOM = 16;
   const BORDER_H_LEFT   =  8;
   const BORDER_H_RIGHT  =  8;
   const TEXT_W = 256;
   const TEXT_H = 192;

   let SCREEN_W = BORDER_H_LEFT + TEXT_W + BORDER_H_RIGHT;
   let SCREEN_H = BORDER_V_TOP  + TEXT_H + BORDER_V_BOTTOM;

   // canvas is the outer canvas where the aspect ratio is corrected
   let canvas = document.getElementById("canvas");
   canvas.width  = SCREEN_W * 2;
   canvas.height = SCREEN_H * 2;

   //console.log(`${screenCanvas.width} ${screenCanvas.height}`);
}

calculateGeometry();

/**************************************************/

const DOT_WIDTH = 342;
const DOT_HEIGHT = 262;

let tms9928a_canvas = document.getElementById("canvas");
let tms9928a_context = tms9928a_canvas.getContext('2d');

// new drawing method
let tms9928a_imagedata = tms9928a_context.createImageData(DOT_WIDTH*2, DOT_HEIGHT*2);
let bmp = new Uint32Array(tms9928a_imagedata.data.buffer);

/*
// old drawing method
let tms9928a_imagedata = tms9928a_context.getImageData(0, 0, DOT_WIDTH*2, DOT_HEIGHT*2);
let imagedata_buffer = new ArrayBuffer(tms9928a_imagedata.data.length);
let imagedata_buf8 = new Uint8ClampedArray(imagedata_buffer);
let imagedata_data = new Uint32Array(imagedata_buffer);
*/

function vdp_screen_update(ptr) {
   let start = ptr / wasm_instance.HEAPU32.BYTES_PER_ELEMENT;
   let size = DOT_WIDTH*DOT_HEIGHT;
   let buffer = wasm_instance.HEAPU32.subarray(start,start+size);

   let ptr0 = 0;
   let ptr1 = 0;
   let ptr2 = DOT_WIDTH*2;

   for(let y=0;y<DOT_HEIGHT;y++) {
      for(let x=0;x<DOT_WIDTH;x++) {
         let pixel = buffer[ptr0];
         bmp[ptr1++] = pixel;
         bmp[ptr1++] = pixel;
         bmp[ptr2++] = pixel;
         bmp[ptr2++] = pixel;
         ptr0++;
      }
      ptr1 += DOT_WIDTH*2;
      ptr2 += DOT_WIDTH*2;
   }

   // new drawing method
   tms9928a_context.putImageData(tms9928a_imagedata, -60, -48);

   /*
   // old drawing method
   tms9928a_imagedata.data.set(imagedata_buf8);
   tms9928a_context.putImageData(tms9928a_imagedata, -60, -48);
   */

   frames++;
   if(end_of_frame_hook !== undefined) end_of_frame_hook();

   if(frames % 60 == 0) {
      // update LED
      document.getElementById("LED").style.visibility = LED>0 ? "visible" : "hidden";
   }
}

