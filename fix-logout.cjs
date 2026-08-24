const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

if (!code.includes("import { auth, logout } from '../lib/firebase';")) {
  code = code.replace(
    "import { \n  Search,",
    "import { auth, logout } from '../lib/firebase';\nimport { \n  Search,"
  );
}

code = code.replace(
  `{ id: 'logout', title: 'Log out', icon: LogOut, onClick: () => {
        const { logout } = require('../lib/firebase');
        logout();
    } },`,
  `{ id: 'logout', title: 'Log out', icon: LogOut, onClick: logout },`
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
