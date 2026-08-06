const fs = require('fs');

let fileUpload = fs.readFileSync('src/components/FileUpload.tsx', 'utf8');

// Add useEffect import
fileUpload = fileUpload.replace(
  'import React, { useState, useRef, ChangeEvent, DragEvent } from "react";',
  'import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";'
);

// We need to inject the useEffect and remove the onFilesChange calls from within setFiles
fileUpload = fileUpload.replace(
  '            if (onFilesChange) onFilesChange(updated);\n            return updated;\n          });',
  '            return updated;\n          });'
);

fileUpload = fileUpload.replace(
  '      if (onFilesChange) onFilesChange(updated);\n      return updated;\n    });',
  '      return updated;\n    });'
);

const hookCode = `
  const onFilesChangeRef = useRef(onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  const prevFilesRef = useRef(initialFiles);
  useEffect(() => {
    if (files !== prevFilesRef.current) {
      if (onFilesChangeRef.current) {
        onFilesChangeRef.current(files);
      }
      prevFilesRef.current = files;
    }
  }, [files]);
`;

fileUpload = fileUpload.replace(
  '  const fileInputRef = useRef<HTMLInputElement>(null);',
  '  const fileInputRef = useRef<HTMLInputElement>(null);\n' + hookCode
);

fs.writeFileSync('src/components/FileUpload.tsx', fileUpload);
