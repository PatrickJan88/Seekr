const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const shortcutHook = `
  useEffect(() => {
    const handleKeyDown = (e /*: KeyboardEvent*/) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target && e.target.isContentEditable)
      ) {
        return;
      }

      // Check for Cmd+N (Mac), Ctrl+N (Windows), or just N
      if ((e.metaKey && e.key.toLowerCase() === 'n') || 
          (e.ctrlKey && e.key.toLowerCase() === 'n') ||
          (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        setIsFormOpen(true);
        setEditingApp(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, []);
`;

// Insert after: const [locationFilter, setLocationFilter] = useState<string | null>(null);
code = code.replace(
  /const \[locationFilter, setLocationFilter\] = useState<string \| null>\(null\);/,
  `const [locationFilter, setLocationFilter] = useState<string | null>(null);\n${shortcutHook}`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
