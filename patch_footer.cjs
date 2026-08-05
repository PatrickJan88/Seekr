const fs = require('fs');

const footerContent = `import React from 'react';
import BlobTextReveal from './BlobTextReveal';

interface FooterProps {
  logo: React.ReactNode;
  brandName: string;
  socialLinks: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
}

export function Footer({
  logo,
  brandName,
  socialLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="pt-6 pb-2 bg-slate-50 border-t border-slate-200 mt-auto flex flex-col">
      <div className="px-4 lg:px-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col">
            <a
              href="/"
              className="flex items-center gap-x-2"
              aria-label={brandName}
            >
              {logo}
            </a>
            <div className="mt-2 text-sm text-slate-800">
              <BlobTextReveal />
            </div>
          </div>
          
          <ul className="flex list-none mt-6 md:mt-0 space-x-3">
            {socialLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-8 flex text-xs text-slate-400">
          <div>{copyright.text}</div>
          {copyright.license && <div className="ml-2">{copyright.license}</div>}
        </div>
      </div>
    </footer>
  );
}
`;

fs.writeFileSync('src/components/Footer.tsx', footerContent);
