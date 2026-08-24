const fs = require('fs');
let code = fs.readFileSync('src/components/SidebarNav.tsx', 'utf8');

// Change outer sidebar background to white
code = code.replace(
  "className={`flex flex-col w-[260px] h-full bg-[#faf9f7] border-r border-[#efefef] p-4 font-sans ${className}`}",
  "className={`flex flex-col w-[260px] h-full bg-white border-r border-[#efefef] p-4 font-sans ${className}`}"
);

fs.writeFileSync('src/components/SidebarNav.tsx', code);
console.log("SidebarNav background updated.");
