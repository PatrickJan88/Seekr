const fs = require('fs');
let code = fs.readFileSync('src/components/SankeyChart.tsx', 'utf8');

code = code.replace(
  '<div className={isFullscreen ? "fixed inset-0 z-50 bg-[#121722]/80 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center items-center overflow-auto" : "relative w-full"}>',
  '<div className={isFullscreen ? "fixed inset-0 z-50 bg-[#121722]/80 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center items-center overflow-auto" : "relative w-full flex-1 flex flex-col min-h-[500px]"}>'
);

code = code.replace(
  'className={`bg-white p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full ${isFullscreen ? \'max-w-7xl h-[92vh] overflow-hidden\' : \'h-[600px]\'} flex flex-col relative`}',
  'className={`bg-white p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full ${isFullscreen ? \'max-w-7xl h-[92vh] overflow-hidden\' : \'flex-1 min-h-[500px]\'} flex flex-col relative`}'
);
fs.writeFileSync('src/components/SankeyChart.tsx', code);
