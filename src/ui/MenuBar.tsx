import * as React from 'react';
import { Menubar } from 'radix-ui';
import { commands, runCommand, unlockAudio } from './commands';
import type { Command } from './commands';
import { menuModel } from './menuModel';
import type { MenuItemDef } from './menuModel';
import { setUiCapturesKeyboard } from './uiState';
import { useAutoHide } from './useAutoHide';

const CHECK_GLYPH = '\u2713';    // ✓
const SUBMENU_GLYPH = '\u203A';  // ›

/** value a radio item is identified by inside its group */
function radioValue(item: MenuItemDef): string {
   return item.kind === 'command' ? (item.arg ?? item.id) : '';
}

/** the radio group value is derived from the live emulator state, not from a local store */
function findCheckedRadio(items: MenuItemDef[]): string {
   for (const item of items) {
      if (item.kind !== 'command') continue;
      const command = commands[item.id];
      if (command?.type === 'radio' && command.isChecked?.(item.arg)) return radioValue(item);
   }
   return '';
}

function hasRadio(items: MenuItemDef[]): boolean {
   return items.some(item => item.kind === 'command' && commands[item.id]?.type === 'radio');
}

function MenuBar() {
   // '' means no menu is open
   const [openMenu, setOpenMenu] = React.useState('');
   // check and radio items read their state live from the emulator, so a menu opening
   // has to re-render them
   const [, refresh] = React.useReducer((tick: number) => tick + 1, 0);

   const barRef = React.useRef<HTMLDivElement>(null);
   const open = openMenu !== '';
   const visible = useAutoHide({ barRef, open });

   // while a menu is open the emulator must not steal Tab, arrows or letters
   React.useEffect(() => {
      setUiCapturesKeyboard(open);
      return () => setUiCapturesKeyboard(false);
   }, [open]);

   const handleValueChange = (value: string) => {
      setOpenMenu(value);
      refresh();
   };

   // Radix closes the menu when an item is selected; for check/radio items we keep it open
   // so the tick can be seen moving, and let Escape or a click outside close it
   const onItemSelect = (command: Command, id: string, arg?: string) => (event: Event) => {
      if (command.type === 'checkbox' || command.type === 'radio') {
         event.preventDefault();
         runCommand(id, arg);
         refresh();
         return;
      }
      runCommand(id, arg);
   };

   function renderItem(item: MenuItemDef, index: number): React.ReactNode {
      if (item.kind === 'separator') {
         return <Menubar.Separator key={`separator-${index}`} className="menu__separator" />;
      }

      if (item.kind === 'submenu') {
         return (
            <Menubar.Sub key={item.id}>
               <Menubar.SubTrigger className="menu__item" data-ui>
                  {item.label}
                  <span className="menu__shortcut">{SUBMENU_GLYPH}</span>
               </Menubar.SubTrigger>
               <Menubar.Portal>
                  <Menubar.SubContent className="menu" data-ui sideOffset={-3} alignOffset={3}>
                     {renderItemList(item.items)}
                  </Menubar.SubContent>
               </Menubar.Portal>
            </Menubar.Sub>
         );
      }

      const command = commands[item.id];
      if (!command) return null;

      const label = item.label ?? command.label;
      const disabled = command.isEnabled ? !command.isEnabled(item.arg) : false;
      const onSelect = onItemSelect(command, item.id, item.arg);
      const shortcut = command.shortcut
         ? <span className="menu__shortcut">{command.shortcut}</span>
         : null;

      if (command.type === 'checkbox') {
         return (
            <Menubar.CheckboxItem
               key={item.id}
               className="menu__item"
               data-ui
               disabled={disabled}
               checked={command.isChecked?.(item.arg) ?? false}
               onSelect={onSelect}
            >
               <Menubar.ItemIndicator className="menu__indicator">{CHECK_GLYPH}</Menubar.ItemIndicator>
               {label}
               {shortcut}
            </Menubar.CheckboxItem>
         );
      }

      if (command.type === 'radio') {
         return (
            <Menubar.RadioItem
               key={item.id}
               className="menu__item"
               data-ui
               disabled={disabled}
               value={radioValue(item)}
               onSelect={onSelect}
            >
               <Menubar.ItemIndicator className="menu__indicator">{CHECK_GLYPH}</Menubar.ItemIndicator>
               {label}
               {shortcut}
            </Menubar.RadioItem>
         );
      }

      return (
         <Menubar.Item
            key={item.id}
            className="menu__item"
            data-ui
            disabled={disabled}
            onSelect={onSelect}
         >
            {label}
            {shortcut}
         </Menubar.Item>
      );
   }

   // Radix radio items need a group: one per menu content, its value read from the emulator
   function renderItemList(items: MenuItemDef[]): React.ReactNode {
      const rendered = items.map(renderItem);
      if (!hasRadio(items)) return rendered;
      return (
         <Menubar.RadioGroup value={findCheckedRadio(items)} onValueChange={() => {}}>
            {rendered}
         </Menubar.RadioGroup>
      );
   }

   return (
      <div
         ref={barRef}
         className="menubar-bar"
         data-ui
         data-visible={visible}
         onPointerDownCapture={unlockAudio}
      >
         <Menubar.Root className="menubar" value={openMenu} onValueChange={handleValueChange} loop>
            {menuModel.map(menu => (
               <Menubar.Menu key={menu.id} value={menu.id}>
                  <Menubar.Trigger className="menubar__title">{menu.label}</Menubar.Trigger>
                  <Menubar.Portal>
                     <Menubar.Content
                        className="menu"
                        data-ui
                        align="start"
                        sideOffset={0}
                        alignOffset={0}
                        // hand the keyboard back to the emulator once the menu is closed
                        onCloseAutoFocus={event => {
                           event.preventDefault();
                           (document.activeElement as HTMLElement | null)?.blur();
                        }}
                     >
                        {renderItemList(menu.items)}
                     </Menubar.Content>
                  </Menubar.Portal>
               </Menubar.Menu>
            ))}
         </Menubar.Root>
      </div>
   );
}

export { MenuBar };
