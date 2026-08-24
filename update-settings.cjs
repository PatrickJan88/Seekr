const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPage.tsx', 'utf8');
code = code.replace("import React from 'react';", "import React from 'react';\nimport { Footer } from './Footer';\nimport { Github, Linkedin } from 'lucide-react';");
code = code.replace('<div className="min-h-screen bg-[#faf9f7] font-sans text-[#121722] pb-12">', '<div className="h-full bg-white font-sans text-[#121722] pb-12">');
code = code.replace(
  '<div className="mt-8 text-center text-xs text-[#777c86] font-medium">\n          Version 2.0.0\n        </div>',
  `<div className="mt-8 text-center text-xs text-[#777c86] font-medium mb-12">
          Version 2.0.0
        </div>
        <div className="mt-12">
          <Footer
            logo={<img src="/assets/seekr%20logo%201.webp" alt="Seekr Logo" className="h-6" />}
            brandName=""
            socialLinks={[
              { icon: <Github size={18} />, href: "https://github.com/PatrickJan88/Seekr/blob/main/README.md", label: "GitHub" },
              { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/in/pofei-r-79586395", label: "LinkedIn" },
              { icon: <img src="/assets/logo%20pofei.svg" alt="Pofei Logo" className="w-[18px] h-[18px]" />, href: "https://pofeiportfolio.vercel.app/", label: "Portfolio" }
            ]}
            mainLinks={[]}
            legalLinks={[]}
            copyright={{
              text: "Disclaimer: This is an AI-generated coding project created solely for research and demonstration purposes. It is not a commercial product, and is not affiliated with any existing companies or trademarks utilizing the \\"Seekr\\" name.",
            }}
          />
        </div>`
);
fs.writeFileSync('src/components/SettingsPage.tsx', code);
