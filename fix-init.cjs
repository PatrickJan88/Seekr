const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
code = code.replace(
  /const \[applications, setApplications\] = useState<JobApplication\[\]>\(\[\]\);\n\s*const filteredApplications = useMemo\(\(\) => \{\n\s*return applications\.filter\(app => \(app\.trackingSystem \|\| 'industry'\) === trackingSystem\);\n\s*\}, \[applications, trackingSystem\]\);\n\s*const \[loading, setLoading\] = useState\(true\);\n\s*const \[isSyncing, setIsSyncing\] = useState\(false\);\n\s*const syncLockRef = useRef\(false\);\n\s*const \[syncError, setSyncError\] = useState<string \| null>\(null\);\n\s*const \[isSidebarOpen, setIsSidebarOpen\] = useState\(true\);\n\s*const \[view, setView\] = useState<'sankey' \| 'kanban' \| 'analytics' \| 'cv-match' \| 'notifications' \| 'settings' \| 'eval-history' \| 'global-market'>\('sankey'\);\n\s*const \[trackingSystem, setTrackingSystem\] = useState<'industry' \| 'academic'>\('industry'\);/,
  `const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncLockRef = useRef(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<'sankey' | 'kanban' | 'analytics' | 'cv-match' | 'notifications' | 'settings' | 'eval-history' | 'global-market'>('sankey');
  const [trackingSystem, setTrackingSystem] = useState<'industry' | 'academic'>('industry');

  const filteredApplications = useMemo(() => {
    return applications.filter(app => (app.trackingSystem || 'industry') === trackingSystem);
  }, [applications, trackingSystem]);`
);
fs.writeFileSync('src/components/Dashboard.tsx', code);
