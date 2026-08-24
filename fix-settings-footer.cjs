const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');

code = code.replace(
  '<div className="h-full bg-white font-sans text-[#121722] pb-12">',
  '<div className="flex-1 flex flex-col font-sans text-[#121722] w-full min-h-full relative">'
);

code = code.replace(
  '<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">',
  '<div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">'
);

code = code.replace(
  '<div className="mt-8 text-center text-xs text-[#777c86] font-medium mb-12">\n          Version 2.0.0\n        </div>',
  ''
);

code = code.replace(
  '<div className="mt-12">\n          <Footer',
  '<div className="mt-auto pt-12">\n          <div className="text-center text-xs text-[#777c86] font-medium mb-8">\n            Version 2.0.0\n          </div>\n          <Footer'
);

fs.writeFileSync('src/components/SettingsPage.tsx', code);
