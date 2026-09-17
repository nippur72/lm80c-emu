// The menu structure is plain data: MenuBar.tsx renders it generically, so adding a
// menu or an item never requires touching the React tree.

type MenuItemDef =
   | { kind: 'command'; id: string; arg?: string; label?: string }
   | { kind: 'separator' }
   | { kind: 'submenu'; id: string; label: string; items: MenuItemDef[] };

type MenuDef = {
   id: string;
   label: string;
   items: MenuItemDef[];
};

/** firmware ids accepted by the ?rom= query string, as loaded by index.html */
const FIRMWARE_IDS = [
   '310', '311', '312', '313',
   '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138',
   '314', '315', '316', '317', '318', '319', '321', '322', '323', '324',
   '64K102', '64K103', '64K104', '64K105',
   '64K111', '64K112', '64K113', '64K114', '64K115', '64K116', '64K117',
   '64K118', '64K119', '64K120'
];

/** the newest 64K rom, shown on its own above the rest */
const LATEST_FIRMWARE_ID = '64K120';

/** a rom version is the number inside its id, so descending means newest first */
function byVersionDescending(a: string, b: string): number {
   return Number(b.replace(/\D/g, '')) - Number(a.replace(/\D/g, ''));
}

function firmwareItem(rom: string): MenuItemDef {
   return { kind: 'command', id: 'machine.setFirmware', arg: rom, label: rom };
}

const RECENT_FIRMWARE_IDS = FIRMWARE_IDS
   .filter(rom => rom.startsWith('64K') && rom !== LATEST_FIRMWARE_ID)
   .sort(byVersionDescending);

const LEGACY_FIRMWARE_IDS = FIRMWARE_IDS.filter(rom => !rom.startsWith('64K'));

const menuModel: MenuDef[] = [
   {
      id: 'file',
      label: 'File',
      items: [
         { kind: 'command', id: 'file.openPrg' },
         { kind: 'command', id: 'file.savePrg' },
         { kind: 'separator' },
         { kind: 'command', id: 'file.openCfCard' },
         { kind: 'command', id: 'file.saveCfCard' },
         { kind: 'separator' },
         { kind: 'command', id: 'file.reload' }
      ]
   },
   {
      id: 'view',
      label: 'View',
      items: [
         { kind: 'command', id: 'view.fullscreen' }
      ]
   },
   {
      id: 'machine',
      label: 'Machine',
      items: [
         { kind: 'command', id: 'machine.restore' },
         { kind: 'command', id: 'machine.reset' },
         { kind: 'separator' },
         {
            kind: 'submenu',
            id: 'machine.firmware',
            label: 'Firmware',
            items: [
               firmwareItem(LATEST_FIRMWARE_ID),
               { kind: 'separator' },
               ...RECENT_FIRMWARE_IDS.map(firmwareItem),
               {
                  kind: 'submenu',
                  id: 'machine.firmware.old',
                  label: 'Old',
                  items: LEGACY_FIRMWARE_IDS.map(firmwareItem)
               }
            ]
         }
      ]
   },
   {
      id: 'keyboard',
      label: 'Keyboard',
      items: [
         { kind: 'command', id: 'keyboard.matrix' },
         { kind: 'command', id: 'keyboard.serial' },
         { kind: 'separator' },
         { kind: 'command', id: 'keyboard.paste' },
         { kind: 'command', id: 'keyboard.pasteFile' }
      ]
   },
   {
      id: 'audio',
      label: 'Audio',
      items: [
         { kind: 'command', id: 'audio.sound' }
      ]
   },
   {
      id: 'help',
      label: 'Help',
      items: [
         { kind: 'command', id: 'help.basicManual' },
         { kind: 'command', id: 'help.dosManual' },
         { kind: 'command', id: 'help.hardwareManual' },
         { kind: 'separator' },
         { kind: 'command', id: 'help.askAI' },
         { kind: 'separator' },
         { kind: 'command', id: 'help.emulatorRepo' },
         { kind: 'command', id: 'help.lm80cRepo' }
      ]
   }
];

export { menuModel, FIRMWARE_IDS };
export type { MenuDef, MenuItemDef };
