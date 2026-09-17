import * as React from 'react';

/** used until the bar has been laid out (kept in step with --menubar-h in menuBar.css) */
const FALLBACK_BAR_HEIGHT = 28;

type AutoHideOptions = {
   /** the element that slides in and out; its layout size is the hover target */
   barRef: React.RefObject<HTMLElement | null>;
   /** true while a menu or submenu is open */
   open: boolean;
};

/**
 * The bar is revealed as soon as the pointer touches the band it occupies, and hidden again
 * when the pointer leaves that band — so its lower edge is the trigger line. Hiding must
 * never happen while a dropdown is open: the dropdown hangs below the bar.
 */
function useAutoHide({ barRef, open }: AutoHideOptions): boolean {
   const [visible, setVisible] = React.useState(false);

   const visibleRef = React.useRef(false);
   const openRef = React.useRef(open);
   const focusInsideRef = React.useRef(false);
   const pointerRef = React.useRef<{ x: number; y: number } | null>(null);

   const apply = React.useCallback((value: boolean) => {
      if (visibleRef.current === value) return;
      visibleRef.current = value;
      setVisible(value);
   }, []);

   const update = React.useCallback((isOpen: boolean) => {
      if (isOpen || focusInsideRef.current) {
         apply(true);
         return;
      }

      const pointer = pointerRef.current;
      if (pointer === null) {
         apply(false);
         return;
      }

      // Show and hide share one rule, otherwise a pointer sitting between the reveal
      // threshold and the hover area would make the bar flicker. Layout sizes are used on
      // purpose: the rect of a bar that is still sliding in would flicker too.
      const width = barRef.current?.offsetWidth ?? window.innerWidth;
      const height = barRef.current?.offsetHeight || FALLBACK_BAR_HEIGHT;
      const left = (document.documentElement.clientWidth - width) / 2;
      const insideBar = pointer.x >= left && pointer.x <= left + width && pointer.y < height;

      apply(insideBar);
   }, [apply, barRef]);

   // re-evaluate when a menu is opened or closed (closing is what hides the bar again)
   React.useEffect(() => {
      openRef.current = open;
      update(open);
   }, [open, update]);

   React.useEffect(() => {
      const onPointer = (event: PointerEvent) => {
         pointerRef.current = { x: event.clientX, y: event.clientY };
         update(openRef.current);
      };
      const onFocusIn = () => {
         focusInsideRef.current = true;
         update(openRef.current);
      };
      const onFocusOut = () => {
         focusInsideRef.current = false;
         update(openRef.current);
      };

      window.addEventListener('pointermove', onPointer);
      // touch and pen have no hover: the tap that touches the bar reveals it
      window.addEventListener('pointerdown', onPointer);

      const bar = barRef.current;
      bar?.addEventListener('focusin', onFocusIn);
      bar?.addEventListener('focusout', onFocusOut);

      return () => {
         window.removeEventListener('pointermove', onPointer);
         window.removeEventListener('pointerdown', onPointer);
         bar?.removeEventListener('focusin', onFocusIn);
         bar?.removeEventListener('focusout', onFocusOut);
      };
   }, [barRef, update]);

   return visible;
}

export { useAutoHide };
