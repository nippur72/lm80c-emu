// screen geometry: 944 x 313 at 14.7 pixel clock frequency (14.77873 from schematics 944/934=14.77873/14.700000)

let border_top = undefined;
let border_bottom = undefined;
let border_h = undefined;
let aspect = 1.4;

const hardware_screen = false;

const TEXT_W = 256*2;
const TEXT_H = 192;

let HIDDEN_SCANLINES_TOP;
let HIDDEN_SCANLINES_BOTTOM;

let BORDER_V;
let BORDER_V_BOTTOM;
let BORDER_H;    
let SCREEN_W;
let SCREEN_H;
let DOUBLE_SCANLINES;
let TOTAL_SCANLINES = HIDDEN_SCANLINES_TOP + BORDER_V + TEXT_H + BORDER_V_BOTTOM + HIDDEN_SCANLINES_BOTTOM;

let canvas, canvasContext;
let screenCanvas, screenContext;
let imageData, bmp;

let saturation = 1.0;

function calculateGeometry() { 
   /*  
   if(border_top    !== undefined && (border_top    > 65 || border_top    < 0)) border_top    = undefined;
   if(border_bottom !== undefined && (border_bottom > 56 || border_bottom < 0)) border_bottom = undefined;
   if(border_h      !== undefined && (border_h      > 40 || border_h      < 0)) border_h      = undefined;
   */
   border_top    = 22;
   border_bottom = 22;
   border_h      = 8*2;

   BORDER_V        = (border_top    !== undefined ? border_top    : 0);
   BORDER_V_BOTTOM = (border_bottom !== undefined ? border_bottom : 0);   
   HIDDEN_SCANLINES_TOP    = 0 - BORDER_V; 
   HIDDEN_SCANLINES_BOTTOM = 0 - BORDER_V_BOTTOM;   
   BORDER_H = border_h !== undefined ? border_h : 0;    
   SCREEN_W = BORDER_H + TEXT_W + BORDER_H;
   SCREEN_H = BORDER_V + TEXT_H + BORDER_V_BOTTOM;
   DOUBLE_SCANLINES = true;
   TOTAL_SCANLINES = HIDDEN_SCANLINES_TOP + BORDER_V + TEXT_H + BORDER_V_BOTTOM + HIDDEN_SCANLINES_BOTTOM;

   // canvas is the outer canvas where the aspect ratio is corrected
   canvas = document.getElementById("canvas");
   canvas.width = SCREEN_W;
   canvas.height = SCREEN_H * (DOUBLE_SCANLINES ? 2 : 1);
   canvasContext = canvas.getContext('2d');

   // screen is the inner canvas that contains the emulated PAL screen
   screenCanvas = document.createElement("canvas");
   screenCanvas.width = SCREEN_W;
   screenCanvas.height = SCREEN_H * (DOUBLE_SCANLINES ? 2 : 1);
   screenContext = screenCanvas.getContext('2d');

   imageData = screenContext.getImageData(0, 0, SCREEN_W, SCREEN_H * (DOUBLE_SCANLINES ? 2 : 1));
   
   bmp = new Uint32Array(imageData.data.buffer);   
}

calculateGeometry();

const palette = new Uint32Array(16);
const halfpalette = new Uint32Array(16);

let hide_scanlines = false;
let show_scanlines = false;
let charset_offset = 0;

function buildPalette() {
   function applySaturation(r,g,b, s) {      
      const L = 0.3*r + 0.6*g + 0.1*b;
      const new_r = r + (1.0 - s) * (L - r);
      const new_g = g + (1.0 - s) * (L - g);
      const new_b = b + (1.0 - s) * (L - b);
      return { r: new_r, g: new_g, b: new_b };
   }

   function setPalette(i,r,g,b) { 
      let color = applySaturation(r,g,b, saturation);
      palette[i] = 0xFF000000 | color.r | color.g << 8 | color.b << 16; 
      halfpalette[i] = 0xFF000000 | ((color.r/1.2)|0) | ((color.g/1.2)|0) << 8 | ((color.b/1.2)|0) << 16; 
      if(hide_scanlines || !show_scanlines) halfpalette[i] = palette[i];
   }

   /*
   // old palette
   setPalette( 0, 0x00, 0x00, 0x00);  // black
   setPalette( 1, 0x00, 0x00, 0xff);  // blue
   setPalette( 2, 0x00, 0x80, 0x00);  // green
   setPalette( 3, 0x00, 0x90, 0xff);  // cyan
   setPalette( 4, 0x60, 0x00, 0x00);  // red
   setPalette( 5, 0x80, 0x30, 0xf0);  // magenta
   setPalette( 6, 0x6c, 0x87, 0x01);  // yellow
   setPalette( 7, 0xc0, 0xc0, 0xc0);  // bright grey
   setPalette( 8, 0x5f, 0x5f, 0x6f);  // dark grey
   setPalette( 9, 0x80, 0x80, 0xff);  // bright blue
   setPalette(10, 0x50, 0xdf, 0x30);  // bright green
   setPalette(11, 0x87, 0xc5, 0xff);  // bright cyan
   setPalette(12, 0xed, 0x50, 0x8c);  // bright red
   setPalette(13, 0xff, 0x90, 0xff);  // bright magenta
   setPalette(14, 0xdf, 0xdf, 0x60);  // bright yellow
   setPalette(15, 0xff, 0xff, 0xff);  // white
   */

   // palette from FPGA
   setPalette( 0, 0x00, 0x00, 0x00);  // black
   setPalette( 1, 0x00, 0x00, 0xff);  // blue
   setPalette( 2, 0x00, 0x88, 0x00);  // green
   setPalette( 3, 0x00, 0x88, 0xff);  // cyan
   setPalette( 4, 0xaa, 0x00, 0x00);  // red
   setPalette( 5, 0xff, 0x00, 0xff);  // magenta
   setPalette( 6, 0x77, 0x88, 0x00);  // yellow
   setPalette( 7, 0x99, 0x99, 0x99);  // bright grey
   setPalette( 8, 0x55, 0x55, 0x55);  // dark grey
   setPalette( 9, 0x88, 0x88, 0xff);  // bright blue
   setPalette(10, 0x00, 0xff, 0x00);  // bright green
   setPalette(11, 0x44, 0xff, 0xff);  // bright cyan
   setPalette(12, 0xff, 0x44, 0x55);  // bright red
   setPalette(13, 0xff, 0x99, 0xff);  // bright magenta
   setPalette(14, 0xcc, 0xff, 0x00);  // bright yellow
   setPalette(15, 0xff, 0xff, 0xff);  // white
}

// #region rendering at the cycle level

let raster_y = 0;        // 0 to TOTAL SCANLINES (0-311)
let raster_x = 0;        // 0 to SCREEN_W (720)
let raster_y_text = 0;   // y relative to display area
let raster_x_text = 0;   // x relative to display area

// #region rendeding at scanline level

// (not used) draws the whole frame 
function drawFrame() {
   for(let t=0;t<SCREEN_H;t++) {
      drawFrame_y(raster_y);      
   }
}

function drawFrame_y()
{
   drawFrame_y_text(raster_y - BORDER_V);
   drawFrame_y_border(raster_y);
   raster_y++;
   if(raster_y >= SCREEN_H) {
      raster_y = 0; 
      updateCanvas();     
   }
}

function updateCanvas() {
   canvasContext.putImageData(imageData, 0, 0);
   canvasContext.drawImage(screenCanvas, 0, 0, canvas.width, canvas.height);
}

function drawFrame_y_border(y) 
{
   // draw borders
   for(let x=0; x<SCREEN_W; x++) {
      const inside = y>=BORDER_V && y<(BORDER_V+TEXT_H) && x>=BORDER_H && x<BORDER_H+TEXT_W;
      if(!inside)
      {
         setPixelBorder(x,y, vdc_border_color);
      }
   }
}

/*
function drawFrame_y_text(y) 
{  
   let video = vdc_page_7 ? bank7 : bank3;

   if(vdc_graphic_mode_enabled) 
   {
      let offs;
      switch(vdc_graphic_mode_number) {            
         case 5: // GR 5 640x192 1bpp            
            offs = offs_2[y];
            for(let x=0; x<80; x++, offs++) {
               const row = video[offs]; 
               for(let xx=0;xx<8;xx++) {                     
                  const pixel_color = (row & (1<<xx)) > 0 ? vdc_text80_foreground : vdc_text80_background;                                                   
                  setPixel640(x*8+xx, y, pixel_color);
               }
            }
            break;
         case 4: // GR 4 320x192 2 colors per 8 pixels
            offs = offs_2[y];
            for(let x=0; x<40; x++, offs += 2) {
               const row = video[offs];
               const color = video[offs+1];
               const fg = (color & 0xF0) >> 4;
               const bg = (color & 0x0F);
               for(let xx=0;xx<8;xx++) {                     
                  const pixel_color = (row & (1<<xx)) > 0 ? fg : bg;                                                   
                  setPixel320(x*8+xx, y, pixel_color);
               }
            }
            break;
         case 3: // GR 3 160x192 4bpp			
            offs = offs_2[y];
            for(let x=0; x<80; x++, offs++) {
               const code = video[offs];
               const left_pixel_color = (code & 0x0F);
               const right_pixel_color = (code & 0xF0) >> 4;
               setPixel160(x*2+0, y, left_pixel_color);
               setPixel160(x*2+1, y, right_pixel_color);
            }               
            break;      
         case 2: // GR 2 320x192 1bpp
            offs = offs_1[y];
            for(let x=0; x<40; x++, offs++) {                  
               const row = video[offs];
               for(let xx=0;xx<8;xx++) {                     
                  const pixel_color = (row & (1<<xx)) > 0 ? vdc_text80_foreground : vdc_text80_background;                                                   
                  setPixel320(x*8+xx, y, pixel_color);
               }
            }
            break;
         case 1: // GR 1 160x192 1bpp with two colors per 8 pixels			
            offs = offs_1[y];
            for(let x=0; x<20; x++, offs += 2) {
               const code = video[offs];
               const color = video[offs+1];
               const fg = (color & 0xF0) >> 4;
               const bg = (color & 0x0F);
               for(let xx=0;xx<8;xx++) {                     
                  const pixel_color = (code & (1<<xx)) > 0 ? fg : bg;                                                   
                  setPixel160(x*8+xx, y, pixel_color);
               }                  
            }
            break;
         case 0: // GR 0 160x96 4bpp 
            if(y % 2 == 0) { 
               let by = y>>1;
               offs = offs_0[by];
               for(let x=0; x<80; x++, offs++) {                  
                  const code = video[offs];
                  const left_pixel_color = (code & 0x0F);
                  const right_pixel_color = (code & 0xF0) >> 4;
                  setPixel96(x*2+0, by, left_pixel_color);
                  setPixel96(x*2+1, by, right_pixel_color);
               }
            }
            break;
      }      
   }
   // text modes 
   else if(vdc_text80_enabled)
   {      
      // 80 columns text mode          
      const by = y >> 3;
      const oy = y & 0b111;

      let offs = ((by & 7) << 8) + ((by >> 3) * 80);
      for(let x=0; x<80; x++, offs++)
      {
         const code = video[0x3800+offs];  
         
         const startchar = code*8;
         
         const row  = charset[charset_offset+startchar+oy];
         for(let xx=0;xx<8;xx++) {
            const pixel_color = (row & (1<<xx)) > 0 ? vdc_text80_foreground : vdc_text80_background;                                                   
            setPixel640(x*8+xx, y, pixel_color);
         }
      }
   }
   else
   {
      // 40 columns text mode 
      const by = y >> 3;
      const oy = y & 0b111;

      let offs = ((by & 7) << 8) + ((by >> 3) * 80);
      for(let x=0; x<40; x++, offs+=2)
      {
         const code = video[0x3800+offs];
         const color = video[0x3801+offs];
         
         const bg = color & 0xF;
         const fg = color >> 4;

         const startchar = code*8;
         
         const row  = charset[charset_offset+startchar+oy];
         for(let xx=0;xx<8;xx++) {
            const pixel_color = (row & (1<<xx)) > 0 ? fg : bg;                  
            const c = palette[pixel_color]; 
            const c1 = halfpalette[pixel_color];                   
            setPixel320(x*8+xx, y, pixel_color);
         }
      }
   }
}
*/

// #endregion 

// double scanline drawing routines

function setPixelBorder(x, y, color) {  
   if(DOUBLE_SCANLINES) {    
      const c0 = palette[color];   
      const c1 = halfpalette[color];   
      const ptr0 = ((y*2)+0) * SCREEN_W + x;   
      const ptr1 = ((y*2)+1) * SCREEN_W + x;      
      bmp[ ptr0 ] = c0;      
      bmp[ ptr1 ] = c1;      
   } else {
      const c0 = palette[color];   
      const ptr0 = y * SCREEN_W + x;         
      bmp[ ptr0 ] = c0;            
   }
}

function setPixel640(x, y, color) {
   if(DOUBLE_SCANLINES) {    
      const c0 = palette[color];   
      const c1 = halfpalette[color];   
      const xx = x + BORDER_H;
      const yy = (y + BORDER_V)*2;
      const ptr0 = (yy+0) * SCREEN_W + xx;
      const ptr1 = (yy+1) * SCREEN_W + xx;
      bmp[ ptr0 ] = c0;
      bmp[ ptr1 ] = c1;
   } else {
      const c0 = palette[color];      
      const xx = x + BORDER_H;
      const yy = (y + BORDER_V);
      const ptr0 = (yy+0) * SCREEN_W + xx;      
      bmp[ ptr0 ] = c0;      
   }
}

function setPixel320(x, y, color) {   
   if(DOUBLE_SCANLINES) {    
      const c0 = palette[color];   
      const c1 = halfpalette[color];   
      const yy = (y + BORDER_V) * 2;
      let ptr0 = (yy+0) * SCREEN_W + x*2 + BORDER_H;
      let ptr1 = (yy+1) * SCREEN_W + x*2 + BORDER_H;
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0   ] = c0;
      bmp[ ptr1++ ] = c1;
      bmp[ ptr1   ] = c1;
   } else {
      const c0 = palette[color];         
      const yy = (y + BORDER_V);
      let ptr0 = (yy+0) * SCREEN_W + x*2 + BORDER_H;      
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0   ] = c0;
   }
}

function setPixel160(x, y, color) {   
   if(DOUBLE_SCANLINES) {    
      const c0 = palette[color];   
      const c1 = halfpalette[color];   
      
      const yy = (y + BORDER_V)*2;

      let ptr0 = (yy+0) * SCREEN_W + x*4 + BORDER_H;
      let ptr1 = (yy+1) * SCREEN_W + x*4 + BORDER_H;
      
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0   ] = c0;
      bmp[ ptr1++ ] = c1;
      bmp[ ptr1++ ] = c1;
      bmp[ ptr1++ ] = c1;
      bmp[ ptr1   ] = c1;
   } else {
      const c0 = palette[color];   
      
      const yy = (y + BORDER_V);

      let ptr0 = (yy+0) * SCREEN_W + x*4 + BORDER_H;   
      
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0++ ] = c0;
      bmp[ ptr0   ] = c0;
   }
}

function setPixel96(x, y, color) {   
   if(DOUBLE_SCANLINES) {    
      setPixel160(x,y*2+0,color);
      setPixel160(x,y*2+1,color);
   } else {
      setPixel160(x,y,color);      
   }
}

