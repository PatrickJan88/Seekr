const fs = require('fs');
let code = fs.readFileSync('src/components/EvaluateHistoryPage.tsx', 'utf8');

if (!code.includes('setNestedBreadcrumb')) {
  code = code.replace(
    'interface EvaluateHistoryPageProps {\n  applications: JobApplication[];\n  onAddToWishlist: (result: any, role: string) => void;\n}',
    'interface EvaluateHistoryPageProps {\n  applications: JobApplication[];\n  onAddToWishlist: (result: any, role: string) => void;\n  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;\n}'
  );

  code = code.replace(
    'export function EvaluateHistoryPage({ applications, onAddToWishlist }: EvaluateHistoryPageProps) {',
    'export function EvaluateHistoryPage({ applications, onAddToWishlist, setNestedBreadcrumb }: EvaluateHistoryPageProps) {'
  );

  code = code.replace(
    `const [selectedEval, setSelectedEval] = useState<SavedEvaluation | null>(null);`,
    `const [selectedEval, setSelectedEval] = useState<SavedEvaluation | null>(null);

  useEffect(() => {
    if (setNestedBreadcrumb) {
      if (selectedEval) {
        setNestedBreadcrumb({
          label: 'Evaluation Details',
          onBack: () => setSelectedEval(null)
        });
      } else {
        setNestedBreadcrumb(null);
      }
    }
  }, [selectedEval, setNestedBreadcrumb]);`
  );

  // Remove local back button
  code = code.replace(
    /      \{selectedEval && \(\s*<div className="flex items-center justify-between mb-4">\s*<button[\s\S]*?<\/button>\s*<\/div>\s*\)\}/,
    ''
  );

  fs.writeFileSync('src/components/EvaluateHistoryPage.tsx', code);
}
