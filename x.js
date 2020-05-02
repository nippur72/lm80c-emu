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
