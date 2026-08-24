const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

code = code.replace(
  "function NavItem({ \n  item, \n  activeId, \n  onSelect,\n  level = 0\n}: { \n  item: NavItemData; \n  activeId: string; \n  onSelect: (id: string) => void;\n  level?: number;\n}) {",
  "const NavItem: React.FC<{ \n  item: NavItemData; \n  activeId: string; \n  onSelect: (id: string) => void;\n  level?: number;\n}> = ({ \n  item, \n  activeId, \n  onSelect,\n  level = 0\n}) => {"
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
