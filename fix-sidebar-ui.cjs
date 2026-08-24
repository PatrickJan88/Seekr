const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

const oldSectionRegex = /<div className="flex items-center gap-3 px-2 mb-6">[\s\S]*?<div className="flex-1 overflow-y-auto \[&::-webkit-scrollbar\]:hidden \[-ms-overflow-style:none\] \[scrollbar-width:none\] flex flex-col gap-5 mt-2">/m;

const newSection = `<div className="flex items-center gap-2 px-2.5 mb-6 mt-2">
        <img src="/assets/seekr%20logo%201.webp" alt="Seekr Logo" className="w-auto h-6 object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="px-2.5 mb-1 text-[11px] font-bold tracking-wider text-[#a5a5a5] uppercase">
            ROLE
          </span>
          <div className="relative">
            <div onClick={() => {
              const el = document.getElementById('tracking-dropdown');
              if (el) el.classList.toggle('hidden');
            }} className="flex items-center justify-between px-2.5 py-[7px] text-[#525866] font-normal hover:bg-[#faf9f7] hover:text-[#121722] rounded-lg cursor-pointer transition-colors border border-transparent">
              <span className="text-[13px] tracking-wide truncate">
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
          </div>
        </div>`;

code = code.replace(oldSectionRegex, newSection);
fs.writeFileSync('src/components/SidebarNav.tsx', code);
