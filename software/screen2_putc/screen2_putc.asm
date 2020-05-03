; firmware v3.8
VDP_DAT    equ $0030   ; VDP data port
CHRST88    equ $427B   ; start of 8x8 font in firmware ROM
SETVDPADRS equ $05E0   ; firmware routine that sets VDP address in HL

ORG $A000

;
; Prints a character in screen 2 mode
;
; formula is:
; SOURCE_ADDRESS = CHRST88 + character*8
; DEST_BMP_ADDRESS = X*8 + Y*256
; DEST_COLOR_ADDRESS = &H2000 + X*8 + Y*256
;
; the A register is not preserved
;

; these could be passed in registers HL, DE
CH:  db 0   ; character to print
COL: db 0   ; color (bg|fg)
X:   db 0   ; x coordinate (column 0-31)
Y:   db 0   ; y coordinate (row 0-23)

SCREEN2_PUTC:
   PUSH BC
   PUSH DE
   PUSH HL

   ; calculate source address
   LD    A, (CH)      ;
   LD    L, A         ;
   LD    H, 0         ;
   ADD   HL, HL       ;
   ADD   HL, HL       ;
   ADD   HL, HL       ; HL = ch * 8
   LD    DE, CHRST88  ; DE = start of 8x8 fonts in ROM
   ADD   HL, DE       ; HL = start of character in ROM

   PUSH  HL           ; save calculated address

   ; calculate dest address in bitmap vram
   LD    A, (X)       ;
   LD    L, A         ;
   LD    H, 0         ; HL = X
   ADD   HL, HL       ;
   ADD   HL, HL       ;
   ADD   HL, HL       ; HL = X*8
   LD    A, (Y)
   LD    D, A         ;
   LD    E, 0         ; DE = Y * 256
   ADD   HL, DE       ; HL = X*8 + Y*256

   PUSH  HL           ; save dest

   ; calculate dest address in color vram
   LD    DE, $2000     ;
   ADD   HL, DE        ; HL = $2000 + X*8 + Y*256

   DI
;----------------------

fill_col:
   ; HL contains the address
   CALL  SETVDPADRS
   LD    B, 8            ; repeat for 8 rows
   LD    C, VDP_DAT      ; VDP data mode
   LD    A, (col)
fill_col_1:
   OUT   (C), A
   NOP
   NOP
   NOP
   DJNZ  fill_col_1

copia_bmp:
   POP   HL              ; dest address was saved in stack
   CALL  SETVDPADRS
   POP   HL              ; source address was saved in stack
   LD    B, 8            ; repeat for 8 rows
   LD    C, VDP_DAT      ; VDP data mode

copia_bmp_1:
   OUTI
   NOP                   ; wait...
   NOP                   ; ...a while
   NOP                   ;
   JR   NZ, copia_bmp_1

;----------------------

   EI

   POP HL
   POP DE
   POP BC
   RET

