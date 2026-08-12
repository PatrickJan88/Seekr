import React from 'react';
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
  mainLinks,
  copyright,
}: FooterProps) {
  return (
    <footer className="py-3 bg-white mt-auto flex flex-col font-sans text-[#121722]">
      <div className="px-6 md:px-8 w-full flex-1 flex flex-col justify-between gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-x-2 shrink-0"
              aria-label={brandName}
            >
              {logo}
            </a>
            <div className="text-xs text-[#121722]">
              <BlobTextReveal />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {mainLinks && mainLinks.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full text-xs font-semibold border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] shadow-2xs h-8 px-3 transition-all cursor-pointer"
              >
                {link.label}
              </a>
            ))}

            <ul className="flex list-none space-x-2">
              {socialLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border border-[#efefef] shadow-2xs text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] transition-all cursor-pointer"
                  >
                    {link.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="text-[11px] text-[#777c86] leading-tight flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="max-w-none w-full">{copyright.text}</div>
          {copyright.license && <div className="shrink-0">{copyright.license}</div>}
        </div>
      </div>
    </footer>
  );
}
