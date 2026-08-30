const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyIntelligenceStudio.tsx', 'utf-8');

// Add Star import
code = code.replace(/Info\n\} from 'lucide-react';/, "Info,\n  Star\n} from 'lucide-react';");

// Remove PRESET_COMPANIES
code = code.replace(/const PRESET_COMPANIES = \[[\s\S]*?\];/, '');

// Add recent searches and handleToggleSave
code = code.replace(/  \/\/ Copy state\n  const \[copiedKey, setCopiedKey\] = useState<string \| null>\(null\);/, 
`  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [recentSearches, setRecentSearches] = useState<{name: string, url: string}[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('seekr_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const handleToggleSave = async () => {
    if (!currentTeardown) return;
    const userId = auth.currentUser?.uid || 'guest_user';
    const existing = savedRecords.find(r => r.companyName === currentTeardown.companyName);
    
    if (existing) {
       try {
         await deleteSavedTeardown(existing.id, userId);
         setSavedRecords(prev => prev.filter(r => r.id !== existing.id));
         toast.success('Removed from Saved');
       } catch (err) {}
    } else {
       try {
         const saved = await saveTeardown(userId, currentTeardown);
         setSavedRecords(prev => [saved, ...prev]);
         toast.success('Company intelligence saved!');
       } catch (err) {}
    }
  };`
);

// Modify handleGenerate
const autoSaveBlock = `         const userId = auth.currentUser?.uid || 'guest_user';
         try {
           const saved = await saveTeardown(userId, finalTeardown);
           setSavedRecords(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
         } catch (saveErr) {
         }`;
code = code.replace(autoSaveBlock, `         // Add to recent searches
         setRecentSearches(prev => {
           const newItem = { name: finalTeardown!.companyName, url: finalTeardown!.websiteUrl };
           const filtered = prev.filter(r => r.name.toLowerCase() !== newItem.name.toLowerCase());
           const next = [newItem, ...filtered].slice(0, 10);
           localStorage.setItem('seekr_recent_searches', JSON.stringify(next));
           return next;
         });`);

// Update history text
code = code.replace(/'History'/g, "'Saved'");
code = code.replace(/>History</g, ">Saved<");
code = code.replace(/Company Search History/g, "Saved Companies");

fs.writeFileSync('src/components/CompanyIntelligenceStudio.tsx', code);
