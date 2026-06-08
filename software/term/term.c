#include <stdio.h>

// valid for 64K v1.05 firmware
#define CRSR_STATE 0x531C

int main() {
   printf("Terminal program for the LM80C\r\n");

   // *((unsigned char *)CRSR_STATE) = 255;

   while(1) {
      char c = getch();
      printf("%c",c);
   }
}
