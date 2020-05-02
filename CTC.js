class CTC
{
   enabled = false;         // chip is counting
   counter = 0;             // counter
   limit = cpuSpeed / 100;  // counter limit 10 msec (100Hz)

   busy = false;            // interrupt is in course

   IEI_cb = undefined;      // callback to ask if interrupt line is free

   IEO() {
      if(this.busy) return 0;  // busy
      else          return 1;  // not busy, ENABLE
   }

   enable(en) {
      if(en === this.enabled) return;

      //console.log(`${total_cycles} CTC: enabled=${en}`);
      this.enabled = en;
   }

   advance(ticks) {
      if(!this.enabled) return;

      this.counter += ticks;

      if(this.counter > this.limit) {
         this.counter -= this.limit;
         this.counter_trigger();
      }
   }

   counter_trigger() {
      if(this.IEI_cb !== undefined && this.IEI_cb() === 0) {
         console.log(`${total_cycles} CTC: can't trigger, INT line is occupied by SIO`);
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
      cpu.interrupt(false, 0x46);
      // console.log(`${total_cycles} CTC: interrupt started`);
   }

   cpu_found_RETI() {
      if(this.busy && this.IEI_cb() == 1) {
         this.busy = false;
         //console.log(`${total_cycles} CTC: interrupt ended`);
      }
   }
}

