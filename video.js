
let aspect = 1.2;

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


