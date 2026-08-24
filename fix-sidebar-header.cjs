const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

const oldHeaderRegex = /<div className="relative">\s*<div onClick=\{\(\) => \{\s*const el = document\.getElementById\('tracking-dropdown'\);\s*if \(el\) el\.classList\.toggle\('hidden'\);\s*\}\} className="flex items-center justify-between px-2 py-2 mb-4 hover:bg-\[#faf9f7\] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-\[#efefef\]">\s*<div className="flex items-center gap-3">\s*<div className="w-7 h-7 bg-\[#121722\] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">\s*\{trackingSystem === 'academic' \? 'A' : 'S'\}\s*<\/div>\s*<div className="flex flex-col">\s*<span className="text-\[13px\] font-bold text-\[#121722\] leading-tight">\s*\{trackingSystem === 'academic' \? 'Academic Seekr' : 'Industry Seekr'\}\s*<\/span>\s*<span className="text-\[11px\] text-\[#777c86\] mt-0\.5">Free Plan<\/span>\s*<\/div>\s*<\/div>\s*<ChevronDown size=\{14\} className="text-\[#a5a5a5\]" \/>\s*<\/div>\s*<div id="tracking-dropdown" className="hidden absolute top-full left-0 w-full bg-white border border-\[#efefef\] rounded-xl shadow-lg z-50 overflow-hidden mb-4 p-1">\s*<div onClick=\{\(\) => \{ setTrackingSystem\?\.\('industry'\); document\.getElementById\('tracking-dropdown'\)\?\.classList\.add\('hidden'\); \}\} className="flex items-center px-3 py-2 text-\[13px\] text-\[#121722\] hover:bg-\[#faf9f7\] cursor-pointer rounded-lg font-medium">\s*Industry Seekr\s*\{trackingSystem === 'industry' && <div className="ml-auto w-1\.5 h-1\.5 rounded-full bg-\[#0068f9\]" \/>\}\s*<\/div>\s*<div onClick=\{\(\) => \{ setTrackingSystem\?\.\('academic'\); document\.getElementById\('tracking-dropdown'\)\?\.classList\.add\('hidden'\); \}\} className="flex items-center px-3 py-2 text-\[13px\] text-\[#121722\] hover:bg-\[#faf9f7\] cursor-pointer rounded-lg font-medium">\s*Academic Seekr\s*\{trackingSystem === 'academic' && <div className="ml-auto w-1\.5 h-1\.5 rounded-full bg-\[#0068f9\]" \/>\}\s*<\/div>\s*<\/div>\s*<\/div>/;

const newHeader = `<div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-7 h-7 bg-[#121722] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">
          S
        </div>
        <span className="text-[15px] font-bold text-[#121722] leading-tight">Seekr App</span>
      </div>
      
      <div className="relative mb-4 px-2">
        <div onClick={() => {
          const el = document.getElementById('tracking-dropdown');
          if (el) el.classList.toggle('hidden');
        }} className="flex items-center justify-between px-3 py-2 bg-[#faf9f7] hover:bg-[#f4f4f5] rounded-lg cursor-pointer transition-colors border border-[#efefef]">
          <span className="text-[13px] font-semibold text-[#121722] leading-tight">
            {trackingSystem === 'academic' ? 'Academic Seekr' : 'Industry Seekr'}
          </span>
          <ChevronDown size={14} className="text-[#a5a5a5]" />
        </div>
        <div id="tracking-dropdown" className="hidden absolute top-full mt-1 left-2 right-2 bg-white border border-[#efefef] rounded-xl shadow-lg z-50 overflow-hidden p-1">
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

code = code.replace(oldHeaderRegex, newHeader);
fs.writeFileSync('src/components/SidebarNav.tsx', code);
