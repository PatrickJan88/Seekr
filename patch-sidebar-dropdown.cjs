const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

const oldDropdown = /<div className="relative">\s*<div onClick=\{\(\) => \{\s*const el = document\.getElementById\('tracking-dropdown'\);\s*if \(el\) el\.classList\.toggle\('hidden'\);\s*\}\} className="flex items-center justify-between px-2\.5 py-\[7px\] text-\[#525866\] font-normal hover:bg-\[#faf9f7\] hover:text-\[#121722\] rounded-lg cursor-pointer transition-colors border border-transparent">\s*<span className="text-\[13px\] tracking-wide truncate">\s*\{trackingSystem === 'academic' \? 'Academic Seekr' : 'Industry Seekr'\}\s*<\/span>\s*<ChevronDown size=\{14\} className="text-\[#a5a5a5\]" \/>\s*<\/div>\s*<div id="tracking-dropdown" className="hidden absolute top-full mt-1 left-2 right-2 bg-white border border-\[#efefef\] rounded-xl shadow-lg z-50 overflow-hidden p-1">/m;

const newDropdown = `<div className="relative group">
            <div className="flex items-center justify-between px-2.5 py-[7px] text-[#525866] font-normal hover:bg-[#faf9f7] hover:text-[#121722] rounded-lg cursor-pointer transition-colors border border-transparent">
              <span className="text-[13px] tracking-wide truncate">
                {trackingSystem === 'academic' ? 'Academic Seekr' : 'Industry Seekr'}
              </span>
              <ChevronDown size={14} className="text-[#a5a5a5]" />
            </div>
            <div className="hidden group-hover:block absolute top-full mt-1 left-2 right-2 bg-white border border-[#efefef] rounded-xl shadow-lg z-50 overflow-hidden p-1">`;

code = code.replace(oldDropdown, newDropdown);

// Clean up the onClick classes that added 'hidden' on selection
code = code.replace(/document\.getElementById\('tracking-dropdown'\)\?\.classList\.add\('hidden'\); /g, '');

fs.writeFileSync('src/components/SidebarNav.tsx', code);
