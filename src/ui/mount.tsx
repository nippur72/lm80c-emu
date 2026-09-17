import { createRoot } from 'react-dom/client';
import { MenuBar } from './MenuBar';
import './menuBar.css';

/**
 * Mounts the menu bar into the #menubar-root placeholder of index.html.
 * Must be called at runtime from main(): ui/commands.ts imports emulator.ts, so evaluating
 * this module while emulator.ts is still initialising would close an import cycle.
 */
function mountMenuBar(): void {
   const container = document.getElementById('menubar-root');
   if (!container) {
      console.error('menubar: #menubar-root is missing from index.html');
      return;
   }
   createRoot(container).render(<MenuBar />);
}

export { mountMenuBar };
