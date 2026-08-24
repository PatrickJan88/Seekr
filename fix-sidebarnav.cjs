const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

// Update NavItem text and icon colors
code = code.replace(
  /'text-\[#777c86\] hover:bg-\[#faf9f7\] hover:text-\[#121722\]'/,
  `'text-[#525866] font-normal hover:bg-[#faf9f7] hover:text-[#121722]'`
);

code = code.replace(
  /className=\{\`w-4 h-4 transition-colors\s*\$\{isActive \? 'text-\[#121722\]' : 'text-\[#a5a5a5\] group-hover:text-\[#777c86\]'\}\s*\`\}/,
  `className={\`w-4 h-4 transition-colors\n              \${isActive ? 'text-[#121722]' : 'text-[#777c86] group-hover:text-[#121722]'}\n            \`}`
);

// Add props to SidebarNav
code = code.replace(
  /applicationCount\?: number\n\}\)/,
  `applicationCount?: number;\n  trackingSystem?: 'industry' | 'academic';\n  setTrackingSystem?: (sys: 'industry' | 'academic') => void;\n})`
);

code = code.replace(
  /export function SidebarNav\(\{/,
  `export function SidebarNav({\n  trackingSystem = 'industry',\n  setTrackingSystem,`
);

// Replace the header to have a working dropdown
const oldHeader = `<div className="flex items-center justify-between px-2 py-2 mb-4 hover:bg-[#faf9f7] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#efefef]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#121722] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#121722] leading-tight">Seekr App</span>
            <span className="text-[11px] text-[#777c86] mt-0.5">Free Plan</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-[#a5a5a5]" />
      </div>`;

const newHeader = `<div className="relative">
      <div onClick={() => {
        const el = document.getElementById('tracking-dropdown');
        if (el) el.classList.toggle('hidden');
      }} className="flex items-center justify-between px-2 py-2 mb-4 hover:bg-[#faf9f7] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#efefef]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#121722] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">
            {trackingSystem === 'academic' ? 'A' : 'S'}
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-[#121722] leading-tight">
              {trackingSystem === 'academic' ? 'Academic Seekr' : 'Industry Seekr'}
            </span>
            <span className="text-[11px] text-[#777c86] mt-0.5">Free Plan</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-[#a5a5a5]" />
      </div>
      <div id="tracking-dropdown" className="hidden absolute top-full left-0 w-full bg-white border border-[#efefef] rounded-xl shadow-lg z-50 overflow-hidden mb-4 p-1">
        <div onClick={() => { setTrackingSystem?.('industry'); document.getElementById('tracking-dropdown')?.classList.add('hidden'); }} className="flex items-center px-3 py-2 text-[13px] text-[#121722] hover:bg-[#faf9f7] cursor-pointer rounded-lg font-medium">
          Industry Seekr
          {trackingSystem === 'industry' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0068f9]" />}
        </div>
        <div onClick={() => { setTrackingSystem?.('academic'); document.getElementById('tracking-dropdown')?.classList.add('hidden'); }} className="flex items-center px-3 py-2 text-[13px] text-[#121722] hover:bg-[#faf9f7] cursor-pointer rounded-lg font-medium">
          Academic Seekr
          {trackingSystem === 'academic' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0068f9]" />}
        </div>
      </div>
      </div>`;

code = code.replace(oldHeader, newHeader);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
