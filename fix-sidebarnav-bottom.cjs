const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

code = code.replace(
  `const bottomItems: NavItemData[] = [
    { id: 'settings', title: 'Settings', icon: Settings },
  ];`,
  `const bottomItems: NavItemData[] = [
    { id: 'settings', title: 'Settings', icon: Settings },
    { id: 'logout', title: 'Log out', icon: LogOut, onClick: () => {
        const { logout } = require('../lib/firebase');
        logout();
    } },
  ];`
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
