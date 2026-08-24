const fs = require('fs');
let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');

if (!code.includes('setNestedBreadcrumb')) {
  code = code.replace(
    'interface CVMatchAssessmentProps {\n  applications: JobApplication[];\n  onAddToWishlist: (result: any, role: string) => void;\n  onViewHistory: () => void;\n  isDemo?: boolean;\n}',
    'interface CVMatchAssessmentProps {\n  applications: JobApplication[];\n  onAddToWishlist: (result: any, role: string) => void;\n  onViewHistory: () => void;\n  isDemo?: boolean;\n  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;\n}'
  );

  code = code.replace(
    'export function CVMatchAssessment({ applications, onAddToWishlist, onViewHistory, isDemo = false }: CVMatchAssessmentProps) {',
    'export function CVMatchAssessment({ applications, onAddToWishlist, onViewHistory, isDemo = false, setNestedBreadcrumb }: CVMatchAssessmentProps) {'
  );

  code = code.replace(
    `const [result, setResult] = useState<MatchResult | null>(null);`,
    `const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    if (setNestedBreadcrumb) {
      if (result) {
        setNestedBreadcrumb({
          label: 'Match Analysis',
          onBack: () => {
            setResult(null);
            setTargetRole('');
            setTargetDescription('');
            setTargetPastedDescription('');
            setStep(1);
            setCoverLetterText(null);
            setInterviewGuideText(null);
          }
        });
      } else {
        setNestedBreadcrumb(null);
      }
    }
  }, [result, setNestedBreadcrumb]);`
  );
  
  // Also fix the layout to match the container of SankeyChart.
  // Currently CVMatchAssessment has: `w-full flex-1 flex flex-col space-y-6 min-h-0`
  // And it's not wrapped in a bg-white container natively if it's the step flow.
  // Let's wrap it uniformly.

  fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
}
