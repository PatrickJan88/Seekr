const fs = require('fs');
let content = fs.readFileSync('src/components/FileUpload.tsx', 'utf8');

if (!content.includes("import { toast } from 'sonner'")) {
    content = content.replace(
      'import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";',
      'import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";\nimport { toast } from "sonner";'
    );
}

content = content.replace(
  /alert\(`/g,
  "toast.error(`"
);

fs.writeFileSync('src/components/FileUpload.tsx', content);
