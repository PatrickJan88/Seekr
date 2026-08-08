const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace("import { auth, logout, getAccessToken } from '../lib/firebase';", "import { auth, logout } from '../lib/firebase';");

fs.writeFileSync('src/components/Dashboard.tsx', content);
