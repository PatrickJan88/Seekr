const fs = require('fs');

function wrapComponent(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // They all start with a bg-white container or similar, let's find the root return
  const returnMatch = code.match(/return\s*\(\s*<div className="([^"]*)"/);
  
  if (returnMatch) {
    const originalClasses = returnMatch[1];
    if (originalClasses.includes('bg-white') && originalClasses.includes('rounded-2xl')) {
      // It's directly applying the white container to the root.
      // We will replace it with the wrapper
      code = code.replace(
        returnMatch[0],
        `return (\n    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">\n      <div className="${originalClasses} w-full flex-1 min-h-[500px] relative"`
      );
      
      code = code.replace(
        /    <\/div>\n  \);\n}/,
        `      </div>\n    </div>\n  );\n}`
      );
      
      fs.writeFileSync(filePath, code);
    }
  }
}

['src/components/GlobalMarket.tsx', 'src/components/NotificationsPage.tsx', 'src/components/SettingsPage.tsx', 'src/components/EvaluateHistoryPage.tsx'].forEach(wrapComponent);

