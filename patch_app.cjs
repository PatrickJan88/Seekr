const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `import { Footer } from './components/Footer';

export default function App() {`;

const replacement = `import { Footer } from './components/Footer';
import { Github, Linkedin } from 'lucide-react';

export default function App() {`;

code = code.replace(target, replacement);

const targetFooter = `<Footer />`;

const replacementFooter = `<Footer
          logo={<img src="/assets/seekr%20logo%201.svg" alt="Seekr Logo" className="h-6" />}
          brandName=""
          socialLinks={[
            { icon: <Github size={18} />, href: "https://github.com/PatrickJan88", label: "GitHub" },
            { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/in/pofei-r-79586395", label: "LinkedIn" }
          ]}
          mainLinks={[
            { href: "https://pofeiportfolio.vercel.app/", label: "🖋 Made by Pofei" }
          ]}
          legalLinks={[]}
          copyright={{
            text: "© 2026 Seekr. All rights reserved.",
          }}
        />`;

code = code.replace(targetFooter, replacementFooter);
fs.writeFileSync('src/App.tsx', code);
