const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!code.includes('const [trackingSystem, setTrackingSystem]')) {
  code = code.replace(
    /const \[view, setView\] = useState.*?;\n/,
    `$&  const [trackingSystem, setTrackingSystem] = useState<'industry' | 'academic'>('industry');\n`
  );
}

code = code.replace(
  /<GlobalMarket isDemo=\{isDemo\} onAddToWishlist=\{handleSave\} \/>/,
  `<GlobalMarket isDemo={isDemo} onAddToWishlist={handleSave} trackingSystem={trackingSystem} />`
);

code = code.replace(
  /<SidebarNav\n/,
  `<SidebarNav\n            trackingSystem={trackingSystem}\n            setTrackingSystem={setTrackingSystem}\n`
);

code = code.replace(
  /<SettingsPage onBack=\{\(\) => setView\('sankey'\)\} onClearData=\{handleClearData\} isSyncing=\{isSyncing\} \/>/,
  `<SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} trackingSystem={trackingSystem} setTrackingSystem={setTrackingSystem} />`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
