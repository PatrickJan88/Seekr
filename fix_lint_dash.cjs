const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(/import \{ JobApplication \} from '\.\.\/types';/, "import { JobApplication, JobStatus } from '../types';");
code = code.replace(/status: st as import\("\.\.\/types"\)\.JobStatus/g, "status: st as JobStatus");

fs.writeFileSync('src/components/Dashboard.tsx', code);
