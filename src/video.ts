import { wasm_instance } from './emscripten_wrapper';
import { led_read } from './utils';
import { end_of_frame_hook } from './emulator';

let frameCounter = 0;

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
   let canvas = document.getElementById("canvas") as HTMLCanvasElement;
   if (canvas) {
      canvas.width  = SCREEN_W * 2;
      canvas.height = SCREEN_H * 2;
   }
}

calculateGeometry();

/**************************************************/

const DOT_WIDTH = 342;
const DOT_HEIGHT = 262;

let tms9928a_canvas = document.getElementById("canvas") as HTMLCanvasElement;
let tms9928a_context = (tms9928a_canvas ? tms9928a_canvas.getContext('2d') : null) as CanvasRenderingContext2D | null;

// new drawing method
let tms9928a_imagedata = tms9928a_context ? tms9928a_context.createImageData(DOT_WIDTH*2, DOT_HEIGHT*2) : null;
let bmp = tms9928a_imagedata ? new Uint32Array(tms9928a_imagedata.data.buffer) : new Uint32Array(0);

function vdp_screen_update(ptr: number) {
   if (!tms9928a_context || !tms9928a_imagedata) return;

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

   frameCounter++;
   if(end_of_frame_hook !== undefined) end_of_frame_hook();

   if(frameCounter % 60 == 0) {
      // update LED
      const ledEl = document.getElementById("LED");
      if (ledEl) {
         ledEl.style.visibility = led_read()>0 ? "visible" : "hidden";
      }
   }
}

(window as any).vdp_screen_update = vdp_screen_update;


export { calculateGeometry, vdp_screen_update, frameCounter };
