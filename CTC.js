class CTC
{
   busy = false;            // interrupt is in course
   IEI_cb = undefined;      // callback to ask if interrupt line is free

   // the counters
   enableds   = new Uint8Array(4).fill(0);
   parameters = new Uint8Array(4).fill(0);
   counters   = new Uint32Array(4).fill(0);
   limits     = new Uint32Array(4).fill(0);
   dividers   = new Uint32Array(4).fill(0);

   write_state = 0;

   IEO() {
      if(this.busy) return 0;  // busy
      else          return 1;  // not busy, ENABLE
   }

   enable(en) {
      if(en === this.enableds[3]) return;

      //console.log(`${total_cycles} CTC: enabled=${en}`);
      this.enableds[3] = en;
   }

   advance(ticks) {
      if(this.enableds[0] === 1) this.advance_counter(0, ticks);
      if(this.enableds[1] === 1) this.advance_counter(1, ticks);
      if(this.enableds[2] === 1) this.advance_counter(2, ticks);
      if(this.enableds[3] === 1) this.advance_counter(3, ticks);
   }

   advance_counter(i, ticks) {
      let max = this.limits[i] * this.dividers[i];
      this.counters[i] += ticks;
      if(this.counters[i] > max) {
         this.counters[i] -= max;
         this.counter_trigger(i);
      }
   }

   counter_trigger(i) {
      if(this.IEI_cb !== undefined && this.IEI_cb() === 0) {
         //console.log(`${total_cycles} CTC: CH${i} can't trigger, INT line is occupied by SIO`);
         return;
      }

      // TODO fix
      /*
      if(this.busy) {
         //console.log(`${total_cycles} CTC: can't trigger, previous INT call not finshed`);
         console.log(`CTC: can't trigger, previous INT call not finshed`);
         return;
      }
      */

      this.busy = true;
      let vector = 0x40 + i * 2;
      cpu.interrupt(false, vector);

      // console.log(`${total_cycles} CTC: CH${i} interrupt started`);
   }

   cpu_found_RETI() {
      if(this.busy && this.IEI_cb() == 1) {
         this.busy = false;
         //console.log(`${total_cycles} CTC: interrupt ended`);
      }
   }

   // cpu interface
   read(port) {
      //console.log(`${total_cycles} CTC: port read ${port}`);
      return 0x00;
   }

   write(port, value) {
      //10100111
      //console.log(`${total_cycles} CTC: port write ${port} <= ${value}`);

      if(port == 3) {
         if(this.write_state === 0) {
            this.write_state = 1;

            this.parameters[port] = value;
            this.dividers[port] = 256;
         }
         else if(this.write_state === 1) {
            this.write_state = 0;
            this.limits[port] = value;
            this.enableds[port] = 1;
         }
      }

      return;
   }
}

