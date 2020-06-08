
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

#define CHIPS_IMPL 1

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define	TMS9928_PALETTE_SIZE                16
#define  TMS9928_TOTAL_HORZ                  342
#define	TMS9928_TOTAL_VERT_NTSC             262
#define	TMS9928_TOTAL_VERT_PAL              313
#define	TMS9928_HORZ_DISPLAY_START          2 + 14 + 8 + 13
#define	TMS9928_VERT_DISPLAY_START_PAL      13 + 51
#define	TMS9928_VERT_DISPLAY_START_NTSC     13 + 27

typedef struct {
   // TODO implement timers
	//TIMER_LINE = 0;
	//int GROMCLK = 1;

	int m_vram_size;                 // 4K, 8K, or 16K
	void *m_out_int_line_cb;         // Callback is called whenever the state of the INT output changes
	void *m_out_gromclk_cb;          // GROMCLK line is optional; if present, pulse it by XTAL/24 rate

	/* TMS9928A internal settings */
	uint8_t  m_ReadAhead;                 // uint8_t
	uint8_t  m_Regs[8];                   // uint8_t
	uint8_t  m_StatusReg;                 // uint8_t
	uint8_t  m_FifthSprite;               // uint8_t
	uint8_t  m_latch;                     // uint8_t
	uint8_t  m_INT;                       // uint8_t
	uint16_t m_Addr;                      // uint16_t
	uint16_t m_colour;                    // uint16_t
	uint16_t m_pattern;                   // uint16_t
	uint16_t m_nametbl;                   // uint16_t
	uint16_t m_spriteattribute;           // uint16_t
	uint16_t m_spritepattern;             // uint16_t
	int      m_colourmask;                // int
	int      m_patternmask;               // int
	uint16_t m_TMS9928_TOTAL_HORZ;        // uint16_t
	bool     m_50hz;                      // bool
	bool     m_reva;                      // bool
	bool     m_99;                        // bool

   uint8_t  *m_vram_space;               // the actual vram

/*
	m_tmpbmp;                             // drawing buffer of RGBA
	m_mode;

	m_top_border;
   m_vertical_size;

   vpos;
*/

   uint32_t palette[TMS9928_PALETTE_SIZE];


    void* user_data;
} tms9928_t;


#ifdef __cplusplus
} /* extern "C" */
#endif

/*-- IMPLEMENTATION ----------------------------------------------------------*/
#ifdef CHIPS_IMPL
#include <string.h>
#ifndef CHIPS_ASSERT
    #include <assert.h>
    #define CHIPS_ASSERT(c) assert(c)
#endif


uint8_t tms9928_vram_read_byte(tms9928_t *vdp, uint16_t address) { return vdp->m_vram_space[address]; }
void tms9928_vram_write_byte(tms9928_t *vdp, uint16_t address, uint8_t data) { vdp->m_vram_space[address] = data; }

uint8_t tms9928_vram_read(tms9928_t *vdp) {
   uint8_t data = vdp->m_ReadAhead;

   vdp->m_ReadAhead = tms9928_vram_read_byte(vdp, vdp->m_Addr);
   vdp->m_Addr = (vdp->m_Addr + 1) & (vdp->m_vram_size - 1);
   vdp->m_latch = 0;

   return data;
}

void tms9928_vram_write(tms9928_t *vdp, uint8_t data) {
   tms9928_vram_write_byte(vdp, vdp->m_Addr, data);

   vdp->m_Addr = (vdp->m_Addr + 1) & (vdp->m_vram_size - 1);
   vdp->m_ReadAhead = data;
   vdp->m_latch = 0;
}

uint8_t tms9928_register_read(tms9928_t *vdp) {
   uint8_t data = vdp->m_StatusReg;

   vdp->m_StatusReg = vdp->m_FifthSprite;
   tms9928_check_interrupt(vdp);
   vdp->m_latch = 0;

   return data;
}

void tms9928_check_interrupt(tms9928_t *vdp) {
   // trigger if vblank and interrupt-enable bits are set
   int b = (vdp->m_StatusReg & 0x80 && vdp->m_Regs[1] & 0x20) ? 1 : 0;

   if(b != vdp->m_INT) {
      vdp->m_INT = b;
      if(vdp->m_out_int_line_cb != NULL )
         vdp->m_out_int_line_cb( vdp->m_INT );
   }
}

void tms9928_update_backdrop(tms9928_t *vdp) {
   // update backdrop colour to transparent if EXTVID bit is set
   if ((vdp->m_Regs[7] & 15) == 0)
      vdp->palette[0] = vdp->m_Regs[0] & 1 ? 0x00000000 : 0xFF000000;
}

void tms9928_update_table_masks(tms9928_t *vdp) {
   vdp->m_colourmask = ( (vdp->m_Regs[3] & 0x7f) << 3 ) | 7;

   // on 91xx family, the colour table mask doesn't affect the pattern table mask
   vdp->m_patternmask = ( (vdp->m_Regs[4] & 3) << 8 ) | ( vdp->m_99 ? (vdp->m_colourmask & 0xff) : 0xff );
}

void tms9928_change_register(tms9928_t *vdp, reg, val) {
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

   let prev = vdp->m_Regs[reg];
   val &= Mask[reg];
   vdp->m_Regs[reg] = val;

   switch (reg)
   {
   case 0:
      /* re-calculate masks and pattern generator & colour */
      if (val & 2)
      {
         vdp->m_colour = ((vdp->m_Regs[3] & 0x80) * 64) & (vdp->m_vram_size - 1);
         vdp->m_pattern = ((vdp->m_Regs[4] & 4) * 2048) & (vdp->m_vram_size - 1);
         vdp->update_table_masks();
      }
      else
      {
         vdp->m_colour = (vdp->m_Regs[3] * 64) & (vdp->m_vram_size - 1);
         vdp->m_pattern = (vdp->m_Regs[4] * 2048) & (vdp->m_vram_size - 1);
      }
      vdp->m_mode = ( (vdp->m_reva ? (vdp->m_Regs[0] & 2) : 0) | ((vdp->m_Regs[1] & 0x10)>>4) | ((vdp->m_Regs[1] & 8)>>1));
      if ((val ^ prev) & 1)
         vdp->update_backdrop();
      break;
   case 1:
      vdp->check_interrupt();
      vdp->m_mode = ( (vdp->m_reva ? (vdp->m_Regs[0] & 2) : 0) | ((vdp->m_Regs[1] & 0x10)>>4) | ((vdp->m_Regs[1] & 8)>>1));
      break;
   case 2:
      vdp->m_nametbl = (val * 1024) & (vdp->m_vram_size - 1);
      break;
   case 3:
      if (vdp->m_Regs[0] & 2)
      {
         vdp->m_colour = ((val & 0x80) * 64) & (vdp->m_vram_size - 1);
         vdp->update_table_masks();
      }
      else
      {
         vdp->m_colour = (val * 64) & (vdp->m_vram_size - 1);
      }
      break;
   case 4:
      if (vdp->m_Regs[0] & 2)
      {
         vdp->m_pattern = ((val & 4) * 2048) & (vdp->m_vram_size - 1);
         vdp->update_table_masks();
      }
      else
      {
         vdp->m_pattern = (val * 2048) & (vdp->m_vram_size - 1);
      }
      break;
   case 5:
      vdp->m_spriteattribute = (val * 128) & (vdp->m_vram_size - 1);
      break;
   case 6:
      vdp->m_spritepattern = (val * 2048) & (vdp->m_vram_size - 1);
      break;
   case 7:
      if ((val ^ prev) & 15)
         vdp->update_backdrop();
      break;
   }
}


void tms9928_register_write(tms9928_t *vdp, data)
{
   if (vdp->m_latch)
   {
      // set high part of read/write address
      vdp->m_Addr = ((data << 8) | (vdp->m_Addr & 0xff)) & (vdp->m_vram_size - 1);

      if (data & 0x80)
      {
         // register write
         vdp->change_register (data & 7, vdp->m_Addr & 0xff);
      }
      else
      {
         if ( !(data & 0x40) )
         {
            // read ahead
            vdp->vram_read();
         }
      }
      vdp->m_latch = 0;
   }
   else
   {
      // set low part of read/write address
      vdp->m_Addr = ((vdp->m_Addr & 0xff00) | data) & (vdp->m_vram_size - 1);
      vdp->m_latch = 1;
   }
}

// this should be the tick function
tms9928_drawline(tms9928_t *vdp)
{
   // TODO implement timers
   /*
   // Handle GROM clock if present
   if (id === GROMCLK)
   {
      // Pulse it
      vdp->m_out_gromclk_cb(ASSERT_LINE);
      vdp->m_out_gromclk_cb(CLEAR_LINE);
      return;
   }
   */

   vdp->vpos++;

   let BackColour = vdp->m_Regs[7] & 15;

   let base = vdp->vpos * vdp->TMS9928_TOTAL_HORZ;

   let y = vdp->vpos - vdp->m_top_border;

   if ( y < 0 || y >= 192 || ! (vdp->m_Regs[1] & 0x40) )
   {
      // Draw backdrop colour
      for ( let i = 0; i < vdp->m_TMS9928_TOTAL_HORZ; i++ )
         vdp->m_tmpbmp[base+i] = vdp->palette[BackColour];

      // vblank is set at the last cycle of the first inactive line
      if ( y == 193 )
      {
         vdp->m_StatusReg |= 0x80;
         vdp->check_interrupt();
      }
   }
   else
   {
      // Draw regular line

      // Left border
      for ( let i = 0; i < vdp->TMS9928_HORZ_DISPLAY_START; i++ )
         vdp->m_tmpbmp[base+i] = vdp->palette[BackColour];

      // Active display

      switch( vdp->m_mode )
      {
      case 0:             /* MODE 0 */
         {
            let addr = vdp->m_nametbl + ( ( y & 0xF8 ) << 2 );

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x+= 8, addr++ )
            {
               let charcode = tms9928_vram_read_byte(&vdp,  addr );
               let pattern =  tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( charcode << 3 ) + ( y & 7 ) );
               let colour =  tms9928_vram_read_byte(&vdp,  vdp->m_colour + ( charcode >> 3 ) );
               let fg = vdp->palette[(colour >> 4) ? (colour >> 4) : BackColour];
               let bg = vdp->palette[(colour & 15) ? (colour & 15) : BackColour];

               for ( let i = 0; i < 8; pattern <<= 1, i++ )
                  vdp->m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
            }
         }
         break;

      case 1:             /* MODE 1 */
         {
            let addr = vdp->m_nametbl + ( ( y >> 3 ) * 40 );
            let fg = vdp->palette[(vdp->m_Regs[7] >> 4) ? (vdp->m_Regs[7] >> 4) : BackColour];
            let bg = vdp->palette[BackColour];

            // Extra 6 pixels left border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 6; x++ )
               vdp->m_tmpbmp[base+x] = bg;

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 6; x < vdp->TMS9928_HORZ_DISPLAY_START + 246; x+= 6, addr++ )
            {
               let charcode = tms9928_vram_read_byte(&vdp,  addr );
               let pattern = tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( charcode << 3 ) + ( y & 7 ) );

               for ( let i = 0; i < 6; pattern <<= 1, i++ )
                  vdp->m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
            }

            // Extra 10 pixels right border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 246; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x++ )
               vdp->m_tmpbmp[base+x] = bg;
         }
         break;

      case 2:             /* MODE 2 */
         {
            let addr = vdp->m_nametbl + ( ( y >> 3 ) * 32 );

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x+= 8, addr++ )
            {
               let charcode = tms9928_vram_read_byte(&vdp,  addr ) + ( ( y >> 6 ) << 8 );
               let pattern = tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( ( charcode & vdp->m_patternmask ) << 3 ) + ( y & 7 ) );
               let colour = tms9928_vram_read_byte(&vdp,  vdp->m_colour + ( ( charcode & vdp->m_colourmask ) << 3 ) + ( y & 7 ) );
               let fg = vdp->palette[(colour >> 4) ? (colour >> 4) : BackColour];
               let bg = vdp->palette[(colour & 15) ? (colour & 15) : BackColour];

               for ( let i = 0; i < 8; pattern <<= 1, i++ )
                  vdp->m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
            }
         }
         break;

      case 3:             /* MODE 1+2 */
         {
            let addr = vdp->m_nametbl + ( ( y >> 3 ) * 40 );
            let fg = vdp->palette[(vdp->m_Regs[7] >> 4) ? (vdp->m_Regs[7] >> 4) : BackColour];
            let bg = vdp->palette[BackColour];

            // Extra 6 pixels left border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 6; x++ )
               vdp->m_tmpbmp[base+x] = bg;

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 6; x < vdp->TMS9928_HORZ_DISPLAY_START + 246; x+= 6, addr++ )
            {
               let charcode = ( tms9928_vram_read_byte(&vdp,  addr ) + ( ( y >> 6 ) << 8 ) ) & vdp->m_patternmask;
               let pattern = tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( charcode << 3 ) + ( y & 7 ) );

               for ( let i = 0; i < 6; pattern <<= 1, i++ )
                  vdp->m_tmpbmp[base+x+i] = ( pattern & 0x80 ) ? fg : bg;
            }

            // Extra 10 pixels right border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 246; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x++ )
               vdp->m_tmpbmp[base+x] = bg;
         }
         break;

      case 4:             /* MODE 3 */
         {
            let addr = vdp->m_nametbl + ( ( y >> 3 ) * 32 );

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x+= 8, addr++ )
            {
               let charcode = tms9928_vram_read_byte(&vdp,  addr );
               let colour = tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( charcode << 3 ) + ( ( y >> 2 ) & 7 ) );
               let fg = vdp->palette[(colour >> 4) ? (colour >> 4) : BackColour];
               let bg = vdp->palette[(colour & 15) ? (colour & 15) : BackColour];

               vdp->m_tmpbmp[base+x+0] = vdp->m_tmpbmp[base+x+1] = vdp->m_tmpbmp[base+x+2] = vdp->m_tmpbmp[base+x+3] = fg;
               vdp->m_tmpbmp[base+x+4] = vdp->m_tmpbmp[base+x+5] = vdp->m_tmpbmp[base+x+6] = vdp->m_tmpbmp[base+x+7] = bg;
            }
         }
         break;

      case 5: case 7:     /* MODE bogus */
         {
            let fg = vdp->palette[(vdp->m_Regs[7] >> 4) ? (vdp->m_Regs[7] >> 4) : BackColour];
            let bg = vdp->palette[BackColour];

            // Extra 6 pixels left border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 6; x++ )
               vdp->m_tmpbmp[base+x] = bg;

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 6; x < vdp->TMS9928_HORZ_DISPLAY_START + 246; x+= 6 )
            {
               vdp->m_tmpbmp[base+x+0] = vdp->m_tmpbmp[base+x+1] = vdp->m_tmpbmp[base+x+2] = vdp->m_tmpbmp[base+x+3] = fg;
               vdp->m_tmpbmp[base+x+4] = vdp->m_tmpbmp[base+x+5] = bg;
            }

            // Extra 10 pixels right border
            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START + 246; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x++ )
               vdp->m_tmpbmp[base+x] = bg;
         }
         break;

      case 6:             /* MODE 2+3 */
         {
            let addr = vdp->m_nametbl + ( ( y >> 3 ) * 32 );

            for ( let x = vdp->TMS9928_HORZ_DISPLAY_START; x < vdp->TMS9928_HORZ_DISPLAY_START + 256; x+= 8, addr++ )
            {
               let charcode = tms9928_vram_read_byte(&vdp,  addr );
               let colour = tms9928_vram_read_byte(&vdp,  vdp->m_pattern + ( ( ( charcode + ( ( y >> 2 ) & 7 ) + ( ( y >> 6 ) << 8 ) ) & vdp->m_patternmask ) << 3 ) );
               let fg = vdp->palette[(colour >> 4) ? (colour >> 4) : BackColour];
               let bg = vdp->palette[(colour & 15) ? (colour & 15) : BackColour];

               vdp->m_tmpbmp[base+x+0] = vdp->m_tmpbmp[base+x+1] = vdp->m_tmpbmp[base+x+2] = vdp->m_tmpbmp[base+x+3] = fg;
               vdp->m_tmpbmp[base+x+4] = vdp->m_tmpbmp[base+x+5] = vdp->m_tmpbmp[base+x+6] = vdp->m_tmpbmp[base+x+7] = bg;
            }
         }
         break;
      }

      // Draw sprites
      if ( ( vdp->m_Regs[1] & 0x50 ) != 0x40 )
      {
         // sprites are disabled
         vdp->m_FifthSprite = 31;
      }
      else
      {
         let sprite_size = ( vdp->m_Regs[1] & 0x02 ) ? 16 : 8;
         let sprite_mag = vdp->m_Regs[1] & 0x01;
         let sprite_height = sprite_size * ( sprite_mag + 1 );
         let spr_drawn = new Uint8Array(32+256+32).fill(0);
         let num_sprites = 0;
         let fifth_encountered = false;

         for ( let sprattr = 0; sprattr < 128; sprattr += 4 )
         {
            let spr_y =  tms9928_vram_read_byte(&vdp,  vdp->m_spriteattribute + sprattr + 0 );

            vdp->m_FifthSprite = sprattr / 4;

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
               let spr_x = tms9928_vram_read_byte(&vdp,  vdp->m_spriteattribute + sprattr + 1 );
               let sprcode = tms9928_vram_read_byte(&vdp,  vdp->m_spriteattribute + sprattr + 2 );
               let sprcol = tms9928_vram_read_byte(&vdp,  vdp->m_spriteattribute + sprattr + 3 );
               let pataddr = vdp->m_spritepattern + ( ( sprite_size == 16 ) ? sprcode & ~0x03 : sprcode ) * 8;

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

               let pattern = tms9928_vram_read_byte(&vdp,  pataddr );

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
                                 vdp->m_StatusReg |= 0x20;
                              spr_drawn[ colission_index ] |= 0x01;

                              if ( sprcol )
                              {
                                 // Has another sprite already drawn here?
                                 if ( ! ( spr_drawn[ colission_index ] & 0x02 ) )
                                 {
                                    spr_drawn[ colission_index ] |= 0x02;
                                    vdp->m_tmpbmp[base+ vdp->TMS9928_HORZ_DISPLAY_START + colission_index - 32 ] = vdp->palette[sprcol];
                                 }
                              }
                           }
                        }
                     }
                  }

                  pattern =  tms9928_vram_read_byte(&vdp,  pataddr + 16 );
                  spr_x += sprite_mag ? 16 : 8;
               }
            }
         }

         // Update sprite overflow bits
         if (~vdp->m_StatusReg & 0x40)
         {
            vdp->m_StatusReg = (vdp->m_StatusReg & 0xe0) | vdp->m_FifthSprite;
            if (fifth_encountered && ~vdp->m_StatusReg & 0x80)
               vdp->m_StatusReg |= 0x40;
         }
      }

      // Right border
      for ( let i = vdp->TMS9928_HORZ_DISPLAY_START + 256; i < vdp->m_TMS9928_TOTAL_HORZ; i++ )
         vdp->m_tmpbmp[base+i] = vdp->palette[BackColour];
   }

   if(vdp->vpos === vdp->m_vertical_size) {
      vdp->vpos = 0;
      if(vdp->screen_update_cb !== undefined)
         vdp->screen_update_cb(vdp->m_tmpbmp);
   }
}

void tms9928_set_palette(tms9928_t *vdp)
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

   vdp->palette = new Uint32Array(vdp->TMS9928_PALETTE_SIZE);

   vdp->palette[ 0] = setPalette(  0,   0,   0);
   vdp->palette[ 1] = setPalette(  0,   0,   0);
   vdp->palette[ 2] = setPalette( 33, 200,  66);
   vdp->palette[ 3] = setPalette( 94, 220, 120);
   vdp->palette[ 4] = setPalette( 84,  85, 237);
   vdp->palette[ 5] = setPalette(125, 118, 252);
   vdp->palette[ 6] = setPalette(212,  82,  77);
   vdp->palette[ 7] = setPalette( 66, 235, 245);
   vdp->palette[ 8] = setPalette(252,  85,  84);
   vdp->palette[ 9] = setPalette(255, 121, 120);
   vdp->palette[10] = setPalette(212, 193,  84);
   vdp->palette[11] = setPalette(230, 206, 128);
   vdp->palette[12] = setPalette( 33, 176,  59);
   vdp->palette[13] = setPalette(201,  91, 186);
   vdp->palette[14] = setPalette(204, 204, 204);
   vdp->palette[15] = setPalette(255, 255, 255);
}

void tms9928_reset(tms9928_t *vdp)
{
   vdp->m_Regs = new Uint8Array(8).fill(0);

   vdp->m_StatusReg = 0;
   vdp->m_FifthSprite = 31;
   vdp->m_nametbl = 0;
   vdp->m_pattern = 0;
   vdp->m_colour = 0;
   vdp->m_spritepattern = 0;
   vdp->m_spriteattribute = 0;
   vdp->m_colourmask = 0x3fff;
   vdp->m_patternmask = 0x3fff;
   vdp->m_Addr = 0;
   vdp->m_ReadAhead = 0;
   vdp->m_INT = 0;
   vdp->m_latch = 0;
   vdp->m_mode = 0;

   /*
   m_line_timer->adjust( screen().time_until_pos( 0, vdp->TMS9928_HORZ_DISPLAY_START ) );

   // TODO: Check clock freq settings in all drivers
   if (!m_out_gromclk_cb.isnull() && m_99)
      m_gromclk_timer->adjust(attotime::zero, 0, clocks_to_attotime(24));
   */
}

void tms9928_init(tms9928_t *vdp, options) {

   const { vram_size, isPal, int_line_cb, gromclk_cb, buffer, screen_update_cb, family99, reva } = options;

   vdp->m_99 = family99;
   vdp->m_reva = reva;

   vdp->m_50hz = isPal;
   vdp->m_top_border = vdp->m_50hz ? vdp->TMS9928_VERT_DISPLAY_START_PAL : vdp->TMS9928_VERT_DISPLAY_START_NTSC;
   vdp->m_vertical_size = vdp->m_50hz ? vdp->TMS9928_TOTAL_VERT_PAL : vdp->TMS9928_TOTAL_VERT_NTSC;
   vdp->m_TMS9928_TOTAL_HORZ = vdp->TMS9928_TOTAL_HORZ;
   vdp->m_vram_size = vram_size || 16384;
   vdp->m_vram_space = new Uint8Array(vdp->m_vram_size);
   vdp->m_tmpbmp = buffer;

   vdp->m_out_int_line_cb = int_line_cb;
   vdp->m_out_gromclk_cb = gromclk_cb;
   vdp->screen_update_cb = screen_update_cb;

   vdp->vpos = 0;  // line counter

   // TODO implement timers
   // m_line_timer = timer_alloc(TIMER_LINE);
   // m_gromclk_timer = timer_alloc(GROMCLK);

   vdp->set_palette();
   vdp->reset();
}

#endif /* CHIPS_IMPL */