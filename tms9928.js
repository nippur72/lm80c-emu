// TMS9928 implementation in JavaScript
//
// written by Antonino Porcino nino.porcino@gmail.com, Apr 2020
//
// Converted directly from the C++ implementation in MAME/MESS
//
// Credits to original authors and copyright holders follows:

// license:BSD-3-Clause
// copyright-holders:Sean Young, Nathan Woods, Aaron Giles, Wilbert Pol, hap
/*
** File: tms9928a.c -- software implementation of the Texas Instruments
**                     TMS9918(A), TMS9928(A) and TMS9929(A), used by the Coleco, MSX and
**                     TI99/4(A).
**
** All undocumented features as described in the following file
** should be emulated.
**
** http://bifi.msxnet.org/msxnet/tech/tms9918a.txt
**
** By Sean Young 1999 (sean@msxnet.org).
** Based on code by Mike Balfour.
** Improved over the years by MESS and MAME teams.
*/

class TMS9928A
{
	PALETTE_SIZE               = 16;

   TOTAL_HORZ                 = 342;
	TOTAL_VERT_NTSC            = 262;
	TOTAL_VERT_PAL             = 313;

	HORZ_DISPLAY_START         = 2 + 14 + 8 + 13;
	VERT_DISPLAY_START_PAL     = 13 + 51;
	VERT_DISPLAY_START_NTSC    = 13 + 27;

   // TODO implement timers
	TIMER_LINE = 0;
	GROMCLK = 1;

	m_vram_size;               // 4K, 8K, or 16K
	m_out_int_line_cb;         // Callback is called whenever the state of the INT output changes
	m_out_gromclk_cb;          // GROMCLK line is optional; if present, pulse it by XTAL/24 rate

	/* TMS9928A internal settings */
	m_ReadAhead;                 // uint8_t
	m_Regs;                      // uint8_t
	m_StatusReg;                 // uint8_t
	m_FifthSprite;               // uint8_t
	m_latch;                     // uint8_t
	m_INT;                       // uint8_t
	m_Addr;                      // uint16_t
	m_colour;                    // uint16_t
	m_pattern;                   // uint16_t
	m_nametbl;                   // uint16_t
	m_spriteattribute;           // uint16_t
	m_spritepattern;             // uint16_t
	m_colourmask;                // int
	m_patternmask;               // int
	m_total_horz;                // const uint16_t
	m_50hz;                      // const bool
	m_reva;                      // const bool
	m_99;                        // const bool

   m_vram_space;                // the actual vram

	m_tmpbmp;                    // drawing buffer of RGBA
	m_mode;

	m_top_border;
   m_vertical_size;

   m_frames;

   vpos;

   palette;

   /*
   read(offset) {
      let value = 0;

      if ((offset & 1) == 0)
         value = this.vram_read();
      else
         value = this.register_read();

      return value;
   }

   write(offset, data) {
      if ((offset & 1) == 0)
         this.vram_write(data);
      else
         this.register_write(data);
   }
   */

   vram_read_byte(address) { return this.m_vram_space[address]; }
   vram_write_byte(address, data) { this.m_vram_space[address] = data; }

   vram_read() {
      let data = this.m_ReadAhead;

      this.m_ReadAhead = this.vram_read_byte(this.m_Addr);
      this.m_Addr = (this.m_Addr + 1) & (this.m_vram_size - 1);
      this.m_latch = 0;

      return data;
   }

   vram_write(data) {
      this.vram_write_byte(this.m_Addr, data);

      this.m_Addr = (this.m_Addr + 1) & (this.m_vram_size - 1);
      this.m_ReadAhead = data;
      this.m_latch = 0;
   }

   register_read() {
      let data = this.m_StatusReg;

      this.m_StatusReg = this.m_FifthSprite;
      this.check_interrupt();
      this.m_latch = 0;

      return data;
   }

   check_interrupt() {
      // trigger if vblank and interrupt-enable bits are set
      let b = (this.m_StatusReg & 0x80 && this.m_Regs[1] & 0x20) ? 1 : 0;

      if(b !== this.m_INT) {
         this.m_INT = b;
         if(this.m_out_int_line_cb !== undefined )
            this.m_out_int_line_cb( this.m_INT );
      }
   }

   update_backdrop() {
      // update backdrop colour to transparent if EXTVID bit is set
      if ((this.m_Regs[7] & 15) == 0)
         this.palette[0] = this.m_Regs[0] & 1 ? 0x00000000 : 0xFF000000;
   }

   update_table_masks() {
      this.m_colourmask = ( (this.m_Regs[3] & 0x7f) << 3 ) | 7;

      // on 91xx family, the colour table mask doesn't affect the pattern table mask
      this.m_patternmask = ( (this.m_Regs[4] & 3) << 8 ) | ( this.m_99 ? (this.m_colourmask & 0xff) : 0xff );
   }

   change_register(reg, val) {
      const Mask = new Uint8Array([ 0x03, 0xfb, 0x0f, 0xff, 0x07, 0x7f, 0x07, 0xff ]);

      /*
         "Mode 0 (GRAPHIC 1)",
         "Mode 1 (TEXT 1)",
         "Mode 2 (GRAPHIC 2)",
         "Mode 1+2 (TEXT 1 variation)",
         "Mode 3 (MULTICOLOR)",
         "Mode 1+3 (BOGUS)",
         "Mode 2+3 (MULTICOLOR variation)",
         "Mode 1+2+3 (BOGUS)"
      */

      let prev = this.m_Regs[reg];
      val &= Mask[reg];
      this.m_Regs[reg] = val;

      switch (reg)
      {
      case 0:
         /* re-calculate masks and pattern generator & colour */
         if (val & 2)
         {
            this.m_colour = ((this.m_Regs[3] & 0x80) * 64) & (this.m_vram_size - 1);
            this.m_pattern = ((this.m_Regs[4] & 4) * 2048) & (this.m_vram_size - 1);
            this.update_table_masks();
         }
         else
         {
            this.m_colour = (this.m_Regs[3] * 64) & (this.m_vram_size - 1);
            this.m_pattern = (this.m_Regs[4] * 2048) & (this.m_vram_size - 1);
         }
         this.m_mode = ( (this.m_reva ? (this.m_Regs[0] & 2) : 0) | ((this.m_Regs[1] & 0x10)>>4) | ((this.m_Regs[1] & 8)>>1));
         if ((val ^ prev) & 1)
            this.update_backdrop();
         break;
      case 1:
         this.check_interrupt();
         this.m_mode = ( (this.m_reva ? (this.m_Regs[0] & 2) : 0) | ((this.m_Regs[1] & 0x10)>>4) | ((this.m_Regs[1] & 8)>>1));
         break;
      case 2:
         this.m_nametbl = (val * 1024) & (this.m_vram_size - 1);
         break;
      case 3:
         if (this.m_Regs[0] & 2)
         {
            this.m_colour = ((val & 0x80) * 64) & (this.m_vram_size - 1);
            this.update_table_masks();
         }
         else
         {
            this.m_colour = (val * 64) & (this.m_vram_size - 1);
         }
         break;
      case 4:
         if (this.m_Regs[0] & 2)
         {
            this.m_pattern = ((val & 4) * 2048) & (this.m_vram_size - 1);
            this.update_table_masks();
         }
         else
         {
            this.m_pattern = (val * 2048) & (this.m_vram_size - 1);
         }
         break;
      case 5:
         this.m_spriteattribute = (val * 128) & (this.m_vram_size - 1);
         break;
      case 6:
         this.m_spritepattern = (val * 2048) & (this.m_vram_size - 1);
         break;
      case 7:
         if ((val ^ prev) & 15)
            this.update_backdrop();
         break;
      }
   }


   register_write(data)
   {
      if (this.m_latch)
      {
         // set high part of read/write address
         this.m_Addr = ((data << 8) | (this.m_Addr & 0xff)) & (this.m_vram_size - 1);

         if (data & 0x80)
         {
            // register write
            this.change_register (data & 7, this.m_Addr & 0xff);
         }
         else
         {
            if ( !(data & 0x40) )
            {
               // read ahead
               this.vram_read();
            }
         }
         this.m_latch = 0;
      }
      else
      {
         // set low part of read/write address
         this.m_Addr = ((this.m_Addr & 0xff00) | data) & (this.m_vram_size - 1);
         this.m_latch = 1;
      }
   }

   // this should be the tick function
   drawline()
   {
      // TODO implement timers
      /*
      // Handle GROM clock if present
      if (id === GROMCLK)
      {
         // Pulse it
         this.m_out_gromclk_cb(ASSERT_LINE);
         this.m_out_gromclk_cb(CLEAR_LINE);
         return;
      }
      */

      this.vpos++;

      let BackColour = this.m_Regs[7] & 15;

      let base = this.vpos * this.TOTAL_HORZ;

      let y = this.vpos - this.m_top_border;

      if ( y < 0 || y >= 192 || ! (this.m_Regs[1] & 0x40) )
      {
         // Draw backdrop colour
         for ( let i = 0; i < this.m_total_horz; i++ )
            this.m_tmpbmp[base+i] = this.palette[BackColour];

         // vblank is set at the last cycle of the first inactive line
         if ( y == 193 )
         {
            this.m_StatusReg |= 0x80;
            this.check_interrupt();
         }
      }
      else
      {
         // Draw regular line

         // Left border
         for ( let i = 0; i < this.HORZ_DISPLAY_START; i++ )
            this.m_tmpbmp[base+i] = this.palette[BackColour];

         // Active display

         switch( this.m_mode )
         {
         case 0:             /* MODE 0 */
            {
               let addr = this.m_nametbl + ( ( y & 0xF8 ) << 2 );

               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 256; x+= 8, addr++ )
               {
                  let charcode = this.vram_read_byte( addr );
                  let pattern =  this.vram_read_byte( this.m_pattern + ( charcode << 3 ) + ( y & 7 ) );
                  let colour =  this.vram_read_byte( this.m_colour + ( charcode >> 3 ) );
                  let fg = this.palette[(colour >> 4) ? (colour >> 4) : BackColour];
                  let bg = this.palette[(colour & 15) ? (colour & 15) : BackColour];

                  for ( let i = 0; i < 8; pattern <<= 1, i++ )
                     this.m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
               }
            }
            break;

         case 1:             /* MODE 1 */
            {
               let addr = this.m_nametbl + ( ( y >> 3 ) * 40 );
               let fg = this.palette[(this.m_Regs[7] >> 4) ? (this.m_Regs[7] >> 4) : BackColour];
               let bg = this.palette[BackColour];

               // Extra 6 pixels left border
               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 6; x++ )
                  this.m_tmpbmp[base+x] = bg;

               for ( let x = this.HORZ_DISPLAY_START + 6; x < this.HORZ_DISPLAY_START + 246; x+= 6, addr++ )
               {
                  let charcode = this.vram_read_byte( addr );
                  let pattern = this.vram_read_byte( this.m_pattern + ( charcode << 3 ) + ( y & 7 ) );

                  for ( let i = 0; i < 6; pattern <<= 1, i++ )
                     this.m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
               }

               // Extra 10 pixels right border
               for ( let x = this.HORZ_DISPLAY_START + 246; x < this.HORZ_DISPLAY_START + 256; x++ )
                  this.m_tmpbmp[base+x] = bg;
            }
            break;

         case 2:             /* MODE 2 */
            {
               let addr = this.m_nametbl + ( ( y >> 3 ) * 32 );

               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 256; x+= 8, addr++ )
               {
                  let charcode = this.vram_read_byte( addr ) + ( ( y >> 6 ) << 8 );
                  let pattern = this.vram_read_byte( this.m_pattern + ( ( charcode & this.m_patternmask ) << 3 ) + ( y & 7 ) );
                  let colour = this.vram_read_byte( this.m_colour + ( ( charcode & this.m_colourmask ) << 3 ) + ( y & 7 ) );
                  let fg = this.palette[(colour >> 4) ? (colour >> 4) : BackColour];
                  let bg = this.palette[(colour & 15) ? (colour & 15) : BackColour];

                  for ( let i = 0; i < 8; pattern <<= 1, i++ )
                     this.m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
               }
            }
            break;

         case 3:             /* MODE 1+2 */
            {
               let addr = this.m_nametbl + ( ( y >> 3 ) * 40 );
               let fg = this.palette[(this.m_Regs[7] >> 4) ? (this.m_Regs[7] >> 4) : BackColour];
               let bg = this.palette[BackColour];

               // Extra 6 pixels left border
               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 6; x++ )
                  this.m_tmpbmp[base+x] = bg;

               for ( let x = this.HORZ_DISPLAY_START + 6; x < this.HORZ_DISPLAY_START + 246; x+= 6, addr++ )
               {
                  let charcode = ( this.vram_read_byte( addr ) + ( ( y >> 6 ) << 8 ) ) & this.m_patternmask;
                  let pattern = this.vram_read_byte( this.m_pattern + ( charcode << 3 ) + ( y & 7 ) );

                  for ( let i = 0; i < 6; pattern <<= 1, i++ )
                     this.m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
               }

               // Extra 10 pixels right border
               for ( let x = this.HORZ_DISPLAY_START + 246; x < this.HORZ_DISPLAY_START + 256; x++ )
                  this.m_tmpbmp[base+x] = bg;
            }
            break;

         case 4:             /* MODE 3 */
            {
               let addr = this.m_nametbl + ( ( y >> 3 ) * 32 );

               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 256; x+= 8, addr++ )
               {
                  let charcode = this.vram_read_byte( addr );
                  let colour = this.vram_read_byte( this.m_pattern + ( charcode << 3 ) + ( ( y >> 2 ) & 7 ) );
                  let fg = this.palette[(colour >> 4) ? (colour >> 4) : BackColour];
                  let bg = this.palette[(colour & 15) ? (colour & 15) : BackColour];

                  this.m_tmpbmp[base+x+0] = this.m_tmpbmp[base+x+1] = this.m_tmpbmp[base+x+2] = this.m_tmpbmp[base+x+3] = fg;
                  this.m_tmpbmp[base+x+4] = this.m_tmpbmp[base+x+5] = this.m_tmpbmp[base+x+6] = this.m_tmpbmp[base+x+7] = bg;
               }
            }
            break;

         case 5: case 7:     /* MODE bogus */
            {
               let fg = this.palette[(this.m_Regs[7] >> 4) ? (this.m_Regs[7] >> 4) : BackColour];
               let bg = this.palette[BackColour];

               // Extra 6 pixels left border
               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 6; x++ )
                  this.m_tmpbmp[base+x] = bg;

               for ( let x = this.HORZ_DISPLAY_START + 6; x < this.HORZ_DISPLAY_START + 246; x+= 6 )
               {
                  this.m_tmpbmp[base+x+0] = this.m_tmpbmp[base+x+1] = this.m_tmpbmp[base+x+2] = this.m_tmpbmp[base+x+3] = fg;
                  this.m_tmpbmp[base+x+4] = this.m_tmpbmp[base+x+5] = bg;
               }

               // Extra 10 pixels right border
               for ( let x = this.HORZ_DISPLAY_START + 246; x < this.HORZ_DISPLAY_START + 256; x++ )
                  this.m_tmpbmp[base+x] = bg;
            }
            break;

         case 6:             /* MODE 2+3 */
            {
               let addr = this.m_nametbl + ( ( y >> 3 ) * 32 );

               for ( let x = this.HORZ_DISPLAY_START; x < this.HORZ_DISPLAY_START + 256; x+= 8, addr++ )
               {
                  let charcode = this.vram_read_byte( addr );
                  let colour = this.vram_read_byte( this.m_pattern + ( ( ( charcode + ( ( y >> 2 ) & 7 ) + ( ( y >> 6 ) << 8 ) ) & this.m_patternmask ) << 3 ) );
                  let fg = this.palette[(colour >> 4) ? (colour >> 4) : BackColour];
                  let bg = this.palette[(colour & 15) ? (colour & 15) : BackColour];

                  this.m_tmpbmp[base+x+0] = this.m_tmpbmp[base+x+1] = this.m_tmpbmp[base+x+2] = this.m_tmpbmp[base+x+3] = fg;
                  this.m_tmpbmp[base+x+4] = this.m_tmpbmp[base+x+5] = this.m_tmpbmp[base+x+6] = this.m_tmpbmp[base+x+7] = bg;
               }
            }
            break;
         }

         // Draw sprites
         if ( ( this.m_Regs[1] & 0x50 ) != 0x40 )
         {
            // sprites are disabled
            this.m_FifthSprite = 31;
         }
         else
         {
            let sprite_size = ( this.m_Regs[1] & 0x02 ) ? 16 : 8;
            let sprite_mag = this.m_Regs[1] & 0x01;
            let sprite_height = sprite_size * ( sprite_mag + 1 );
            let spr_drawn = new Uint8Array(32+256+32).fill(0);
            let num_sprites = 0;
            let fifth_encountered = false;

            for ( let sprattr = 0; sprattr < 128; sprattr += 4 )
            {
               let spr_y =  this.vram_read_byte( this.m_spriteattribute + sprattr + 0 );

               this.m_FifthSprite = sprattr / 4;

               /* Stop processing sprites */
               if ( spr_y == 208 )
                  break;

               if ( spr_y > 0xE0 )
                  spr_y -= 256;

               /* vert pos 255 is displayed on the first line of the screen */
               spr_y++;

               /* is sprite enabled on this line? */
               if ( spr_y <= y && y < spr_y + sprite_height )
               {
                  let spr_x = this.vram_read_byte( this.m_spriteattribute + sprattr + 1 );
                  let sprcode = this.vram_read_byte( this.m_spriteattribute + sprattr + 2 );
                  let sprcol = this.vram_read_byte( this.m_spriteattribute + sprattr + 3 );
                  let pataddr = this.m_spritepattern + ( ( sprite_size == 16 ) ? sprcode & ~0x03 : sprcode ) * 8;

                  num_sprites++;

                  // Fifth sprite encountered?
                  if ( num_sprites == 5 )
                  {
                     fifth_encountered = true;
                     break;
                  }

                  if ( sprite_mag )
                     pataddr += ( ( ( y - spr_y ) & 0x1F ) >> 1 );
                  else
                     pataddr += ( ( y - spr_y ) & 0x0F );

                  let pattern = this.vram_read_byte( pataddr );

                  if ( sprcol & 0x80 )
                     spr_x -= 32;

                  sprcol &= 0x0f;

                  for ( let s = 0; s < sprite_size; s += 8 )
                  {
                     for ( let i = 0; i < 8; pattern <<= 1, i++ )
                     {
                        let colission_index = spr_x + ( sprite_mag ? i * 2 : i ) + 32;

                        for ( let z = 0; z <= sprite_mag; colission_index++, z++ )
                        {
                           // Check if pixel should be drawn
                           if ( pattern & 0x80 )
                           {
                              if ( colission_index >= 32 && colission_index < 32 + 256 )
                              {
                                 // Check for colission
                                 if ( spr_drawn[ colission_index ] )
                                    this.m_StatusReg |= 0x20;
                                 spr_drawn[ colission_index ] |= 0x01;

                                 if ( sprcol )
                                 {
                                    // Has another sprite already drawn here?
                                    if ( ! ( spr_drawn[ colission_index ] & 0x02 ) )
                                    {
                                       spr_drawn[ colission_index ] |= 0x02;
                                       this.m_tmpbmp[base+ this.HORZ_DISPLAY_START + colission_index - 32 ] = this.palette[sprcol];
                                    }
                                 }
                              }
                           }
                        }
                     }

                     pattern =  this.vram_read_byte( pataddr + 16 );
                     spr_x += sprite_mag ? 16 : 8;
                  }
               }
            }

            // Update sprite overflow bits
            if (~this.m_StatusReg & 0x40)
            {
               this.m_StatusReg = (this.m_StatusReg & 0xe0) | this.m_FifthSprite;
               if (fifth_encountered && ~this.m_StatusReg & 0x80)
                  this.m_StatusReg |= 0x40;
            }
         }

         // Right border
         for ( let i = this.HORZ_DISPLAY_START + 256; i < this.m_total_horz; i++ )
            this.m_tmpbmp[base+i] = this.palette[BackColour];
      }

      if(this.vpos === this.m_vertical_size) {
         this.vpos = 0;
         this.m_frames++;
         if(this.screen_update_cb !== undefined && this.m_frames % 2 == 1)
            this.screen_update_cb(this.m_tmpbmp);
      }
   }

   set_palette()
   {
      /*
      New palette (R. Nabet).

      First 3 columns from TI datasheet (in volts).
      Next 3 columns based on formula :
      Y = .299*R + .587*G + .114*B (NTSC)
      (the coefficients are likely to be slightly different with PAL, but who cares ?)
      I assumed the "zero" for R-Y and B-Y was 0.47V.
      Last 3 coeffs are the 8-bit values.

      Color            Y      R-Y     B-Y     R       G       B       R   G   B
      0 Transparent
      1 Black         0.00    0.47    0.47    0.00    0.00    0.00      0   0   0
      2 Medium green  0.53    0.07    0.20    0.13    0.79    0.26     33 200  66
      3 Light green   0.67    0.17    0.27    0.37    0.86    0.47     94 220 120
      4 Dark blue     0.40    0.40    1.00    0.33    0.33    0.93     84  85 237
      5 Light blue    0.53    0.43    0.93    0.49    0.46    0.99    125 118 252
      6 Dark red      0.47    0.83    0.30    0.83    0.32    0.30    212  82  77
      7 Cyan          0.73    0.00    0.70    0.26    0.92    0.96     66 235 245
      8 Medium red    0.53    0.93    0.27    0.99    0.33    0.33    252  85  84
      9 Light red     0.67    0.93    0.27    1.13(!) 0.47    0.47    255 121 120
      A Dark yellow   0.73    0.57    0.07    0.83    0.76    0.33    212 193  84
      B Light yellow  0.80    0.57    0.17    0.90    0.81    0.50    230 206 128
      C Dark green    0.47    0.13    0.23    0.13    0.69    0.23     33 176  59
      D Magenta       0.53    0.73    0.67    0.79    0.36    0.73    201  91 186
      E Gray          0.80    0.47    0.47    0.80    0.80    0.80    204 204 204
      F White         1.00    0.47    0.47    1.00    1.00    1.00    255 255 255
      */

      function applySaturation(r,g,b) {
         const s = 1.0;
         const L = 0.3*r + 0.6*g + 0.1*b;
         const new_r = r + (1.0 - s) * (L - r);
         const new_g = g + (1.0 - s) * (L - g);
         const new_b = b + (1.0 - s) * (L - b);
         return { r: new_r, g: new_g, b: new_b };
      }

      function setPalette(r, g, b) {
         let color = applySaturation(r,g,b, saturation);
         return 0xFF000000 | color.r | color.g << 8 | color.b << 16;
      }

      this.palette = new Uint32Array(this.PALETTE_SIZE);

      this.palette[ 0] = setPalette(  0,   0,   0);
      this.palette[ 1] = setPalette(  0,   0,   0);
      this.palette[ 2] = setPalette( 33, 200,  66);
      this.palette[ 3] = setPalette( 94, 220, 120);
      this.palette[ 4] = setPalette( 84,  85, 237);
      this.palette[ 5] = setPalette(125, 118, 252);
      this.palette[ 6] = setPalette(212,  82,  77);
      this.palette[ 7] = setPalette( 66, 235, 245);
      this.palette[ 8] = setPalette(252,  85,  84);
      this.palette[ 9] = setPalette(255, 121, 120);
      this.palette[10] = setPalette(212, 193,  84);
      this.palette[11] = setPalette(230, 206, 128);
      this.palette[12] = setPalette( 33, 176,  59);
      this.palette[13] = setPalette(201,  91, 186);
      this.palette[14] = setPalette(204, 204, 204);
      this.palette[15] = setPalette(255, 255, 255);
   }

   reset()
   {
      this.m_Regs = new Uint8Array(8).fill(0);

      this.m_StatusReg = 0;
      this.m_FifthSprite = 31;
      this.m_nametbl = 0;
      this.m_pattern = 0;
      this.m_colour = 0;
      this.m_spritepattern = 0;
      this.m_spriteattribute = 0;
      this.m_colourmask = 0x3fff;
      this.m_patternmask = 0x3fff;
      this.m_Addr = 0;
      this.m_ReadAhead = 0;
      this.m_INT = 0;
      this.m_latch = 0;
      this.m_mode = 0;

      /*
      m_line_timer->adjust( screen().time_until_pos( 0, this.HORZ_DISPLAY_START ) );

      // TODO: Check clock freq settings in all drivers
      if (!m_out_gromclk_cb.isnull() && m_99)
         m_gromclk_timer->adjust(attotime::zero, 0, clocks_to_attotime(24));
      */
   }

   constructor(options) {

      const { vram_size, isPal, int_line_cb, gromclk_cb, buffer, screen_update_cb, family99, reva } = options;

      this.m_99 = family99;
      this.m_reva = reva;

      this.m_50hz = isPal;
      this.m_top_border = this.m_50hz ? this.VERT_DISPLAY_START_PAL : this.VERT_DISPLAY_START_NTSC;
      this.m_vertical_size = this.m_50hz ? this.TOTAL_VERT_PAL : this.TOTAL_VERT_NTSC;
      this.m_total_horz = this.TOTAL_HORZ;
      this.m_vram_size = vram_size || 16384;
      this.m_vram_space = new Uint8Array(this.m_vram_size);
      this.m_tmpbmp = buffer;

      this.m_out_int_line_cb = int_line_cb;
      this.m_out_gromclk_cb = gromclk_cb;
      this.screen_update_cb = screen_update_cb;

      this.vpos = 0;  // line counter
      this.m_frames = 0;

      // TODO implement timers
      // m_line_timer = timer_alloc(TIMER_LINE);
      // m_gromclk_timer = timer_alloc(GROMCLK);

      this.set_palette();
      this.reset();
   }
}
