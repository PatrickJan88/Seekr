const fs = require('fs');

let mainContent = fs.readFileSync('src/main.tsx', 'utf8');
mainContent = mainContent.replace(
  "import App from './App.tsx';",
  "import App from './App.tsx';\nimport { Toaster } from 'sonner';"
);
mainContent = mainContent.replace(
  "<App />",
  "<Toaster position=\"bottom-right\" />\n    <App />"
);
fs.writeFileSync('src/main.tsx', mainContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  "import { Toaster } from 'sonner';",
  ""
);
appContent = appContent.replace(
  "<Toaster position=\"bottom-right\" />",
  ""
);
appContent = appContent.replace(
  /alert\('/g,
  "toast.error('"
);
if (!appContent.includes("import { toast } from 'sonner'")) {
    appContent = appContent.replace(
      "import React, { useState, useEffect } from 'react';",
      "import React, { useState, useEffect } from 'react';\nimport { toast } from 'sonner';"
    );
}
fs.writeFileSync('src/App.tsx', appContent);
