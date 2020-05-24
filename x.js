// paste fake basic program
(function() {
   let c=0;
   let s="";

   for(let t=1;t<300;t++) {
      s+=`${t} A=A+${t}\r`;
      c+=t;
   }
   s+="9999 PRINT A\rRUN\r";
   pasteLine(s);
   console.log(c);
})();



// prova di lettura dal psg port B
(function() {
   let PORT_A_WR = 1<<6;
   let PORT_B_WR = 1<<7;
   let PORT_A_RD = 0;
   let PORT_B_RD = 0;
   let r;

   psg_init();
   psg_reset();

   psg_write(0x40, 7);
   console.log(psg_query_addr());

   psg_write(0x41, PORT_A_WR|PORT_B_RD);
   console.log(psg_query_reg(7));

   /*
   psg_write(0x40, 15);
   console.log(psg_query_addr());

   let x = psg_read(0x40);
   console.log(x);
   */

   psg_write(0x40, 14);
   console.log(psg_query_addr());

   psg_write(0x41, 77);
   console.log(psg_query_addr());
})();

   /*
   r = psg_generic_io_write(1,1,7); // latch reg 7
   console.log(r);

   r = psg_generic_io_write(1,0,PORT_A_WR|PORT_B_RD ); // enable io
   console.log(r);

   r = psg_generic_io_write(1,1,15); // latch reg 15
   console.log(r);

   r = psg_generic_io_read(0,1); // read
   console.log(r);
   */



// topaz font
for(let t=0;t<topaz.length/2;t++) rom[0x4383+t] = topaz[t*2];

(function() {
   function reverse(b) {
      b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
      b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
      b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
      return b;
   }
   for(let t=33*8;t<127*8;t++) rom[0x4383+t] = reverse(charset_laser500[(256*8)*4+t]);
})();
