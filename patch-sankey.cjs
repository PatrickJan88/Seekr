const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf8');

// Add Plus to lucide-react import
code = code.replace(/import \{ Maximize2, Minimize2 \} from 'lucide-react';/, "import { Maximize2, Minimize2, Plus } from 'lucide-react';");

code = code.replace(
  /interface SankeyChartProps \{/,
  `interface SankeyChartProps {\n  onAdd?: () => void;`
);

code = code.replace(
  /export function SankeyChart\(\{ applications, isDemo = false \}: SankeyChartProps\) \{/,
  `export function SankeyChart({ applications, isDemo = false, onAdd }: SankeyChartProps) {`
);

const emptyStateRegex = /if \(total === 0\) \{\s*return <div className="flex justify-center items-center h-\[500px\] text-\[#777c86\] font-medium bg-white rounded-2xl border border-\[#efefef\]">No data available for the overview\.<\/div>;\s*\}/;

const newEmptyState = `if (total === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px] text-[#777c86] bg-white rounded-2xl border border-[#efefef]">
        <div className="mb-4 text-[14px] font-medium text-[#525866]">No data available for the overview.</div>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all bg-[#121722] text-white hover:bg-[#2b303b] px-5 py-2.5 shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          <span>New Application</span>
        </button>
      </div>
    );
  }`;

code = code.replace(emptyStateRegex, newEmptyState);

fs.writeFileSync('src/components/SankeyChart.tsx', code);
