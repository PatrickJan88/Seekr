const fs = require('fs');

function fixCvEval() {
  let code = fs.readFileSync('src/components/CVMatchAssessment.tsx', 'utf8');
  
  // 1. Add to interface
  code = code.replace(
    '  onAddToWishlist?: (appData: Partial<JobApplication>) => void;\n  onViewHistory?: () => void;',
    '  onAddToWishlist?: (appData: Partial<JobApplication>) => void;\n  onViewHistory?: () => void;\n  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;'
  );
  
  // 2. Add to destructuring
  code = code.replace(
    'export function CVMatchAssessment({ applications, isDemo = false, onAddToWishlist, onViewHistory }: CVMatchAssessmentProps) {',
    'export function CVMatchAssessment({ applications, isDemo = false, onAddToWishlist, onViewHistory, setNestedBreadcrumb }: CVMatchAssessmentProps) {'
  );
  
  fs.writeFileSync('src/components/CVMatchAssessment.tsx', code);
}

function fixEvalHistory() {
  let code = fs.readFileSync('src/components/EvaluateHistoryPage.tsx', 'utf8');
  
  // 1. Add to interface
  code = code.replace(
    '  onAddToWishlist?: (result: any, role: string) => void;',
    '  onAddToWishlist?: (result: any, role: string) => void;\n  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;'
  );
  
  // 2. Add to destructuring
  code = code.replace(
    'export function EvaluateHistoryPage({ onBack, applications = [], onAddToWishlist }: EvaluateHistoryPageProps) {',
    'export function EvaluateHistoryPage({ onBack, applications = [], onAddToWishlist, setNestedBreadcrumb }: EvaluateHistoryPageProps) {'
  );
  
  fs.writeFileSync('src/components/EvaluateHistoryPage.tsx', code);
}

fixCvEval();
fixEvalHistory();
