// CF card I/O ports
const CF_DATA   = 0x50;  // r/w
const CF_ERR    = 0x51;  // r
const CF_FTR    = 0x51;  // w
const CF_SECCNT = 0x52;  // r/w
const CF_LBA0   = 0x53;  // r/w
const CF_LBA1   = 0x54;  // r/w
const CF_LBA2   = 0x55;  // r/w
const CF_LBA3   = 0x56;  // r/w
const CF_STAT   = 0x57;  // r
const CF_CMD    = 0x57;  // w

// CD card internal registers
let cf_data = 0;
let cf_err = 0;
let cf_ftr = 0;
let cf_seccnt = 0;        // number of sectors to read or write
let cf_stat = 0;
let cf_lba = 0;
let cf_cmd = 0;

// CF card status bits
const CF_STAT_BUSY  = 0b10000000;   // BUSY, registers and buffers are locked
const CF_STAT_RDY   = 0b01000000;   // READY, ready to accept commands
const CF_STAT_DWF   = 0b00100000;   // WRITE FAULT, error writing
const CF_STAT_DSC   = 0b00010000;   // storage card is ready ?
const CF_STAT_DRQ   = 0b00001000;   // DATA REQUEST, data needed to be transferred from to data register
const CF_STAT_CORR  = 0b00000100;   // correctable data error occurred
const CF_STAT_IDX   = 0b00000010;   // always 0
const CF_STAT_ERR   = 0b00000001;   // last command ended with error

// CF card features and commands
const CF_FTR_8BIT    = 0x01;
const CF_FTR_NOP     = 0x69;
const CF_CMD_MODE    = 0xEF;
const CF_CMD_READ    = 0x20;
const CF_CMD_WRITE   = 0x30;
const CF_CMD_STDBY   = 0x92;
const CF_CMD_DRIVEID = 0xEC;

const CF_SECTOR_SIZE          = 512;         // fixed for all CF cards

let cf_ptr    = 0;
let cf_count  = 0;
let cf_read_buffer = [];

let CF_SIZE;
let cf_card;

function cf_create_card() {
   CF_SIZE = CF_SECTOR_SIZE * cf_geometry.heads * cf_geometry.sectorsPerCylinder * cf_geometry.cylinders;
   cf_card = new Uint8Array(CF_SIZE).fill(0x00);
}

function cf_get_card_id() {
   let buffer = new Uint8Array(512).fill(0x00);

   let nsectors = cf_geometry.heads * cf_geometry.sectorsPerCylinder * cf_geometry.cylinders;

   // fill disk size
   buffer[0x0E+0] = (nsectors >> 16 ) & 0xFF;
   buffer[0x0E+1] = (nsectors >> 24 ) & 0xFF;
   buffer[0x0E+2] = (nsectors >>  0 ) & 0xFF;
   buffer[0x0E+3] = (nsectors >> 08 ) & 0xFF;
   // fill number of cylinders
   buffer[0x02+0] = (cf_geometry.cylinders >> 0 ) & 0xFF;
   buffer[0x02+1] = (cf_geometry.cylinders >> 8 ) & 0xFF;
   // fill sectors per cylinder
   buffer[0x0C+0] = (cf_geometry.sectorsPerCylinder >> 0 ) & 0xFF;
   buffer[0x0C+1] = (cf_geometry.sectorsPerCylinder >> 8 ) & 0xFF;
   // fill number of heads
   buffer[0x06+0] = (cf_geometry.heads >> 0 ) & 0xFF;
   buffer[0x06+1] = (cf_geometry.heads >> 8 ) & 0xFF;

   /*
   // fill disk size
   buffer[0x0E+0] = 0x07;
   buffer[0x0E+1] = 0x00;
   buffer[0x0E+2] = 0x00;
   buffer[0x0E+3] = 0xA8;
   // fill number of cylinders
   buffer[0x02+0] = 0xD4;
   buffer[0x02+1] = 0x03;
   // fill sectors per cylinder
   buffer[0x0C+0] = 0x20;
   buffer[0x0C+1] = 0x00;
   // fill number of heads
   buffer[0x06+0] = 0x10;
   buffer[0x06+1] = 0x00;
   */
   return buffer;
}

/*
DOSBFR[0] = IOBUF[0x0E]; // 4 bytes disk size            $07 $00 $00 $A8
DOSBFR[4] = IOBUF[0x02]; // 2 bytes number of cylinders  $D4 $03
DOSBFR[6] = IOBUF[0x0C]; // 2 bytes sectors per cylinder $20 $00
DOSBFR[8] = IOBUF[0x06]; // 2 bytes number of heads      $10 $00
*/

function cf_read(port) {
   if(port === CF_DATA) {
      if(cf_count > 0) {
         cf_data = cf_read_buffer[cf_ptr];
         cf_ptr++;
         cf_count--;
         if(cf_count > 0) cf_stat = CF_STAT_DRQ;
         else             cf_stat = CF_STAT_RDY;
      }
      else {
         cf_stat = CF_STAT_RDY;
      }
      //console.log(`CF: read from CF_DATAREG data ${hex(cf_data)} status=${cf_stat}`);
      return cf_data;
   }
   else if(port === CF_ERR) {
      //console.log(`CF: read from CF_ERROR port ${hex(port)}`);
      return cf_err;
   }
   else if(port === CF_SECCNT) {
      //console.log(`CF: read from CF_SECTCOUNT port ${hex(port)}`);
      return cf_seccnt;
   }
   else if(port === CF_LBA0) { /*console.log(`CF: reading LBA0`);*/ return (cf_lba >>  0) & 0xFF; }
   else if(port === CF_LBA1) { /*console.log(`CF: reading LBA1`);*/ return (cf_lba >>  8) & 0xFF; }
   else if(port === CF_LBA2) { /*console.log(`CF: reading LBA2`);*/ return (cf_lba >> 16) & 0xFF; }
   else if(port === CF_LBA3) { /*console.log(`CF: reading LBA3`);*/ return (cf_lba >> 24) & 0xFF; }
   else if(port === CF_STAT) {
      //console.log(`CF: read from CF_STAT stat= ${cf_stat} @ ${hex(get_z80_pc(),4)}`);
      return cf_stat;
   }
   else {
      console.log(`CF: illegal read from port ${hex(port)}`);
      return 0x00;
   }
}

function cf_write(port, data) {
   if(port === CF_DATA) {
      //console.log(`CF: write to CF_DATAREG port ${hex(port)} data=${data}`);
      cf_data = data;

      if(cf_count > 0) {
         cf_card[cf_ptr] = cf_data;
         cf_ptr++;
         cf_count--;
         if(cf_count > 0) cf_stat = CF_STAT_RDY;
         else             cf_stat = CF_STAT_RDY;
      }
      else {
         cf_stat = CF_STAT_RDY;
      }
   }
   else if(port === CF_FTR) {
      //console.log(`CF: write to CF_FEATURES port ${hex(port)} data=${data}`);
      cf_ftr = data;
   }
   else if(port === CF_SECCNT) {
      //console.log(`CF: write to CF_SECTCOUNT port ${hex(port)} data=${data}`);
      cf_seccnt = data;
   }
   else if(port === CF_LBA0) { cf_lba = (cf_lba & 0xFFFF_FF00) | (data <<  0); /*console.log(`CF LBA is now ${cf_lba}`);*/ }
   else if(port === CF_LBA1) { cf_lba = (cf_lba & 0xFFFF_00FF) | (data <<  8); /*console.log(`CF LBA is now ${cf_lba}`);*/ }
   else if(port === CF_LBA2) { cf_lba = (cf_lba & 0xFF00_FFFF) | (data << 16); /*console.log(`CF LBA is now ${cf_lba}`);*/ }
   else if(port === CF_LBA3) { cf_lba = (cf_lba & 0x00FF_FFFF) | (data << 24); /*console.log(`CF LBA is now ${cf_lba}`);*/ }
   else if(port === CF_CMD) {
      cf_cmd = data;

      // perform command
      if(cf_cmd === CF_CMD_MODE && cf_ftr === CF_FTR_NOP) {
         cf_stat = CF_STAT_RDY;
         console.log(`CF: wake up`);
      }
      else if(cf_cmd === CF_CMD_MODE && cf_ftr === CF_FTR_8BIT) {
         cf_stat = CF_STAT_RDY;
         console.log(`CF: set 8 bit mode`);
      }
      else if(cf_cmd === CF_CMD_READ) {
         let sector = (cf_lba & 0x7FFFFFF); // only 27 bits are used
         let start = sector * 512;
         let end = start + cf_seccnt * 512;
         if(start >= CF_SIZE || end > CF_SIZE || start < 0 || end < 0) {
            //throw `beyond end of disk lba=${cf_lba} start=${start} end=${end}`;
            cf_stat = CF_STAT_ERR;
         }
         else {
            cf_read_buffer = cf_card.slice(start, end);
            cf_ptr = 0;
            cf_count = cf_seccnt * 512;
            cf_stat = CF_STAT_DRQ;
         }
         console.log(`CF: read sector #${sector} (count ${cf_seccnt})`);
      }
      else if(cf_cmd === CF_CMD_WRITE) {
         let sector = (cf_lba & 0x7FFFFFF); // only 27 bits are used
         cf_ptr = sector * 512;
         cf_count = cf_seccnt * 512;
         if(cf_ptr >= CF_SIZE) {
            cf_stat = CF_STAT_ERR;
         }
         else {
            cf_stat = CF_STAT_DRQ;
            console.log(`CF: write sector #${sector} (count ${cf_seccnt})`);
         }
      }
      else if(cf_cmd === CF_CMD_STDBY) {
         cf_stat = CF_STAT_RDY;
         console.log(`CF: standby`);
      }
      else if(cf_cmd === CF_CMD_DRIVEID) {
         cf_read_buffer = cf_get_card_id();
         cf_ptr = 0;
         cf_count = 512;
         cf_stat = CF_STAT_DRQ;
         console.log(`CF: read drive ID`);
      }
      else {
         console.log(`CF: unknown CF_CMD port ${hex(port)} data=${data}`);
      }
   }
   else {
      console.log(`CF: illegal write to port ${hex(port)} data=${data}`);
      return 0x00;
   }
}

let cf_geometry = {
   heads: 0x10,
   cylinders: 0x03d4,
   sectorsPerCylinder: 0x20
};

// create the actual CF card space
cf_create_card();


