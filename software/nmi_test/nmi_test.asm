; firmware v3.8
READ_VSTAT equ $061e
WRITE_VREG equ $0613
NMIUSR     equ $8061
NMISET     equ $2617

PTR1       equ P1+1
PTR2       equ P2+1

org $9000

INSTALL:
   LD DE, MYROUTINE
   JP $2617

MYROUTINE:
   push af
   push de
   push hl

   ld   e, $F6      ; red border
   ld   a, $07      ;
   call WRITE_VREG  ;

P1:
   ld   hl, $02da   ; wait
   call wait        ;

   ld   e, $F7      ; cyan border
   ld   a, $07      ;
   call WRITE_VREG  ;
P2:
   ld   hl, $0500   ; wait
   call wait        ;

   ld   e, $F4      ; blue border
   ld   a, $07      ;
   call WRITE_VREG  ;

   call READ_VSTAT  ; ACK NMI by reading the VDP status register

   pop hl
   pop de
   pop af

   RETN

; wait by simply decrementing HL to 0
wait:
   dec  hl
   ld   a, l
   or   h
   jr   nz, wait
   ret

;
; alternative NMI routine that
; doesn't write to the VDP
;

counter: dw 0

MYROUTINE2:
   push af
   push de
   push hl

   ld hl, (counter)
   inc hl
   ld (counter), hl

   call READ_VSTAT         ; ACK NMI by reading the VDP status register

   pop hl
   pop de
   pop af

   RETN
