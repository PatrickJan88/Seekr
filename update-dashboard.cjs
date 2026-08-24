const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes("import { SidebarNav } from './SidebarNav';")) {
  code = code.replace(
    "import { EvaluateHistoryPage } from './EvaluateHistoryPage';",
    "import { EvaluateHistoryPage } from './EvaluateHistoryPage';\nimport { SidebarNav } from './SidebarNav';\nimport { PanelLeftClose, PanelLeftOpen } from 'lucide-react';"
  );
}

// Add state for sidebar
if (!code.includes('const [isSidebarOpen, setIsSidebarOpen] = useState(true);')) {
  code = code.replace(
    "const [view, setView] = useState",
    "const [isSidebarOpen, setIsSidebarOpen] = useState(true);\n  const [view, setView] = useState"
  );
}

fs.writeFileSync('src/components/Dashboard.tsx', code);
