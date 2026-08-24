import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Eye, 
  Layout, 
  FileText, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash2, 
  Copy,
  ExternalLink,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { TailoredResumeData, ResumeTemplateId, ResumeTemplateMeta, TailoredResumeExperience, TailoredResumeEducation, TailoredResumeProject } from '../types';

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: 'classic-single',
    name: 'Classic Single Column',
    previewLabel: 'Classic Single Column Template',
    description: 'Traditional ATS-standard layout with centered header, clean horizontal rules, and Georgia typography.'
  },
  {
    id: 'modern-single',
    name: 'Modern Single Column',
    previewLabel: 'Modern Single Column Template',
    description: 'Clean contemporary design with accent styling, high readability, and categorized skill tags.'
  },
  {
    id: 'classic-two',
    name: 'Classic Two Column',
    previewLabel: 'Classic Two Column Template',
    description: 'Structured 30/70 split layout separating contact & competencies from detailed work history.'
  },
  {
    id: 'modern-two',
    name: 'Modern Two Column',
    previewLabel: 'Modern Two Column Template',
    description: 'Sleek sidebar layout with distinct profile container, skill badges, and focused timeline.'
  }
];

interface ResumeTemplateStudioProps {
  initialData: TailoredResumeData;
  targetRole?: string;
  companyName?: string;
  onClose: () => void;
}

export function ResumeTemplateStudio({
  initialData,
  targetRole,
  companyName,
  onClose
}: ResumeTemplateStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('modern-single');
  const [resumeData, setResumeData] = useState<TailoredResumeData>(initialData);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);

  // Experience Handlers
  const handleUpdateExperience = (index: number, field: keyof TailoredResumeExperience, value: any) => {
    const newExp = [...resumeData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setResumeData({ ...resumeData, experience: newExp });
  };

  const handleAddExperience = () => {
    const newExp: TailoredResumeExperience = {
      role: 'Software Engineer',
      company: 'Company Name',
      location: 'City, Country',
      period: '2023 - Present',
      bullets: ['Spearheaded key initiatives driving measurable business impact.']
    };
    setResumeData({ ...resumeData, experience: [newExp, ...resumeData.experience] });
    toast.success('Added new experience entry');
  };

  const handleRemoveExperience = (index: number) => {
    const newExp = resumeData.experience.filter((_, i) => i !== index);
    setResumeData({ ...resumeData, experience: newExp });
  };

  const handleUpdateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const newExp = [...resumeData.experience];
    const newBullets = [...newExp[expIndex].bullets];
    newBullets[bulletIndex] = text;
    newExp[expIndex].bullets = newBullets;
    setResumeData({ ...resumeData, experience: newExp });
  };

  const handleAddBullet = (expIndex: number) => {
    const newExp = [...resumeData.experience];
    newExp[expIndex].bullets = [...newExp[expIndex].bullets, 'Engineered high-performance module optimizing delivery speed by 25%.'];
    setResumeData({ ...resumeData, experience: newExp });
  };

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...resumeData.experience];
    newExp[expIndex].bullets = newExp[expIndex].bullets.filter((_, bi) => bi !== bulletIndex);
    setResumeData({ ...resumeData, experience: newExp });
  };

  // Education Handlers
  const handleUpdateEducation = (index: number, field: keyof TailoredResumeEducation, value: any) => {
    const newEdu = [...resumeData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setResumeData({ ...resumeData, education: newEdu });
  };

  const handleAddEducation = () => {
    const newEdu: TailoredResumeEducation = {
      degree: 'B.S. in Computer Science',
      institution: 'University Name',
      year: '2021',
      details: 'Relevant coursework & honors'
    };
    setResumeData({ ...resumeData, education: [...resumeData.education, newEdu] });
  };

  const handleRemoveEducation = (index: number) => {
    const newEdu = resumeData.education.filter((_, i) => i !== index);
    setResumeData({ ...resumeData, education: newEdu });
  };

  // Copy Plain Text Representation
  const handleCopyText = () => {
    const { fullName, title, contact, summary, skills, experience, education } = resumeData;
    const text = `
${fullName.toUpperCase()}
${title}
${[contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).join(' | ')}

PROFESSIONAL SUMMARY
${summary}

SKILLS
• Technical: ${skills.technical.join(', ')}
• Tools: ${skills.tools.join(', ')}
• Methodologies: ${skills.domain.join(', ')}

EXPERIENCE
${experience.map(e => `${e.role} — ${e.company} (${e.period})\n${e.bullets.map(b => `• ${b}`).join('\n')}`).join('\n\n')}

EDUCATION
${education.map(ed => `${ed.degree} — ${ed.institution} (${ed.year})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Resume plain text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // PDF Export Engine
  const handlePrint = (templateId?: ResumeTemplateId) => {
    const activeTmpl = templateId || selectedTemplate;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups in your browser to print or export PDF.');
      return;
    }

    const { fullName, title, contact, summary, skills, experience, education, projects } = resumeData;

    let templateSpecificStyles = '';
    let renderedHtml = '';

    if (activeTmpl === 'classic-single') {
      templateSpecificStyles = `
        body { 
          font-family: 'Times New Roman', Times, Georgia, serif; 
          color: #111; 
          line-height: 1.4; 
          font-size: 10pt; 
          padding: 0.45in; 
          margin: 0;
        }
        .header { 
          text-align: center; 
          border-bottom: 1.5px solid #222; 
          padding-bottom: 6px; 
          margin-bottom: 12px; 
        }
        .name { 
          font-size: 20pt; 
          font-weight: bold; 
          letter-spacing: 0.5px; 
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .title { 
          font-size: 10.5pt; 
          font-style: italic; 
          color: #333; 
          margin-bottom: 4px;
        }
        .contact { 
          font-size: 9pt; 
          color: #444; 
        }
        .section-title { 
          font-size: 10.5pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          border-bottom: 1px solid #333; 
          margin-top: 12px; 
          margin-bottom: 6px; 
          padding-bottom: 1px; 
          letter-spacing: 0.5px;
        }
        .item-block { 
          margin-bottom: 8px; 
          page-break-inside: avoid;
        }
        .exp-header { 
          display: flex; 
          justify-content: space-between; 
          font-weight: bold; 
          font-size: 10pt;
        }
        .exp-sub { 
          display: flex; 
          justify-content: space-between; 
          font-style: italic; 
          font-size: 9.5pt; 
          color: #333; 
          margin-bottom: 3px; 
        }
        ul { 
          margin: 3px 0 6px 18px; 
          padding: 0; 
        }
        li { 
          margin-bottom: 2px; 
          font-size: 9.5pt;
        }
      `;

      renderedHtml = `
        <div class="header">
          <div class="name">${fullName}</div>
          <div class="title">${title}</div>
          <div class="contact">
            ${[contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).join('  |  ')}
          </div>
        </div>

        ${summary ? `
          <div class="section-title">Professional Summary</div>
          <p style="margin: 3px 0 8px 0; font-size: 9.5pt; text-align: justify;">${summary}</p>
        ` : ''}

        <div class="section-title">Technical Skills</div>
        <div style="margin: 3px 0 8px 0; font-size: 9.5pt; line-height: 1.45;">
          ${skills.technical.length > 0 ? `<strong>Languages & Frameworks:</strong> ${skills.technical.join(', ')}<br/>` : ''}
          ${skills.tools.length > 0 ? `<strong>Developer Tools & Platforms:</strong> ${skills.tools.join(', ')}<br/>` : ''}
          ${skills.domain.length > 0 ? `<strong>Methodologies & Domains:</strong> ${skills.domain.join(', ')}` : ''}
        </div>

        <div class="section-title">Work Experience</div>
        ${experience.map(exp => `
          <div class="item-block">
            <div class="exp-header">
              <span><strong>${exp.company}</strong></span>
              <span>${exp.location || ''}</span>
            </div>
            <div class="exp-sub">
              <span>${exp.role}</span>
              <span>${exp.period}</span>
            </div>
            <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>
        `).join('')}

        ${projects && projects.length > 0 ? `
          <div class="section-title">Key Projects</div>
          ${projects.map(p => `
            <div class="item-block">
              <div style="font-weight: bold; font-size: 9.5pt;">${p.name} ${p.link ? `(${p.link})` : ''}</div>
              <p style="margin: 2px 0 4px 0; font-size: 9.5pt;">${p.description}</p>
            </div>
          `).join('')}
        ` : ''}

        <div class="section-title">Education</div>
        ${education.map(edu => `
          <div class="item-block" style="display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 3px;">
            <div><strong>${edu.institution}</strong> — ${edu.degree} ${edu.details ? `<em>(${edu.details})</em>` : ''}</div>
            <div>${edu.year}</div>
          </div>
        `).join('')}
      `;
    } else if (activeTmpl === 'modern-single') {
      templateSpecificStyles = `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          color: #1e293b; 
          line-height: 1.48; 
          font-size: 9.5pt; 
          padding: 0.45in; 
          margin: 0;
        }
        .header { 
          margin-bottom: 14px; 
          border-bottom: 2px solid #0068f9; 
          padding-bottom: 10px; 
        }
        .name { 
          font-size: 22pt; 
          font-weight: 800; 
          color: #0f172a; 
          letter-spacing: -0.5px; 
          line-height: 1.1;
        }
        .title { 
          font-size: 11.5pt; 
          font-weight: 600; 
          color: #0068f9; 
          margin-top: 3px; 
        }
        .contact { 
          font-size: 8.5pt; 
          color: #64748b; 
          margin-top: 6px; 
          display: flex; 
          flex-wrap: wrap; 
          gap: 12px; 
        }
        .section-title { 
          font-size: 10.5pt; 
          font-weight: 700; 
          color: #0f172a; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          margin-top: 12px; 
          margin-bottom: 6px; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }
        .section-title::after { 
          content: ''; 
          flex: 1; 
          height: 1px; 
          background: #e2e8f0; 
        }
        .item-block { 
          margin-bottom: 10px; 
          page-break-inside: avoid;
        }
        .exp-header { 
          display: flex; 
          justify-content: space-between; 
          font-weight: 700; 
          color: #0f172a; 
          font-size: 9.5pt;
        }
        .exp-company { 
          color: #0068f9; 
          font-weight: 600; 
          font-size: 9pt; 
        }
        ul { 
          margin: 3px 0 6px 16px; 
          padding: 0; 
        }
        li { 
          margin-bottom: 2.5px; 
          color: #334155; 
        }
        .pill { 
          display: inline-block; 
          background: #f1f5f9; 
          color: #1e293b;
          padding: 2px 7px; 
          border-radius: 4px; 
          font-size: 8.5pt; 
          margin: 2px; 
          font-weight: 500; 
          border: 1px solid #e2e8f0;
        }
      `;

      renderedHtml = `
        <div class="header">
          <div class="name">${fullName}</div>
          <div class="title">${title}</div>
          <div class="contact">
            ${[contact.email, contact.phone, contact.location, contact.linkedin, contact.github].filter(Boolean).map(c => `<span>${c}</span>`).join(' • ')}
          </div>
        </div>

        ${summary ? `
          <div class="section-title">Professional Summary</div>
          <p style="margin: 0 0 8px 0; color: #334155; font-size: 9.5pt;">${summary}</p>
        ` : ''}

        <div class="section-title">Core Skills & Competencies</div>
        <div style="margin-bottom: 8px;">
          ${skills.technical.concat(skills.tools, skills.domain).map(s => `<span class="pill">${s}</span>`).join(' ')}
        </div>

        <div class="section-title">Professional Experience</div>
        ${experience.map(exp => `
          <div class="item-block">
            <div class="exp-header">
              <span>${exp.role}</span>
              <span style="color: #64748b; font-weight: normal; font-size: 9pt;">${exp.period}</span>
            </div>
            <div class="exp-company">${exp.company} ${exp.location ? `• ${exp.location}` : ''}</div>
            <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
          </div>
        `).join('')}

        <div class="section-title">Education</div>
        ${education.map(edu => `
          <div class="item-block" style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9.5pt;">
            <div><strong>${edu.degree}</strong> — ${edu.institution} ${edu.details ? `<span style="color: #64748b;">(${edu.details})</span>` : ''}</div>
            <div style="color: #64748b;">${edu.year}</div>
          </div>
        `).join('')}
      `;
    } else if (activeTmpl === 'classic-two') {
      templateSpecificStyles = `
        body { 
          font-family: 'Times New Roman', Times, Georgia, serif; 
          color: #222; 
          line-height: 1.38; 
          font-size: 9.5pt; 
          padding: 0.4in; 
          margin: 0;
        }
        .header { 
          text-align: left; 
          border-bottom: 2px solid #222; 
          padding-bottom: 6px; 
          margin-bottom: 12px; 
        }
        .name { 
          font-size: 20pt; 
          font-weight: bold; 
          text-transform: uppercase;
        }
        .title { 
          font-size: 10.5pt; 
          color: #444; 
          font-style: italic;
        }
        .layout-grid { 
          display: grid; 
          grid-template-columns: 2.1in 1fr; 
          gap: 18px; 
        }
        .sidebar { 
          border-right: 1px solid #ccc; 
          padding-right: 12px; 
        }
        .main-col { 
          padding-left: 2px; 
        }
        .section-title { 
          font-size: 10pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          border-bottom: 1px solid #444; 
          margin-top: 8px; 
          margin-bottom: 5px; 
          padding-bottom: 1px;
        }
        .item-block { 
          margin-bottom: 8px; 
          page-break-inside: avoid;
        }
        ul { 
          margin: 2px 0 6px 14px; 
          padding: 0; 
        }
        li { 
          margin-bottom: 2px; 
          font-size: 9pt;
        }
      `;

      renderedHtml = `
        <div class="header">
          <div class="name">${fullName}</div>
          <div class="title">${title}</div>
        </div>
        <div class="layout-grid">
          <div class="sidebar">
            <div class="section-title" style="margin-top: 0;">Contact</div>
            <p style="font-size: 8.5pt; line-height: 1.5; margin: 3px 0 8px 0;">
              ${contact.email}<br/>
              ${contact.phone}<br/>
              ${contact.location}<br/>
              ${contact.linkedin ? contact.linkedin + '<br/>' : ''}
              ${contact.github || ''}
            </p>

            <div class="section-title">Core Skills</div>
            <p style="font-size: 8.5pt; line-height: 1.45; margin: 3px 0 8px 0;">
              <strong>Technical:</strong><br/>${skills.technical.join(', ')}<br/><br/>
              <strong>Tools:</strong><br/>${skills.tools.join(', ')}<br/><br/>
              <strong>Domain:</strong><br/>${skills.domain.join(', ')}
            </p>

            <div class="section-title">Education</div>
            ${education.map(edu => `
              <div style="font-size: 8.5pt; margin-bottom: 5px;">
                <strong>${edu.degree}</strong><br/>
                ${edu.institution} (${edu.year})
              </div>
            `).join('')}
          </div>

          <div class="main-col">
            ${summary ? `
              <div class="section-title" style="margin-top:0;">Profile Summary</div>
              <p style="margin: 3px 0 8px 0; font-size: 9pt; text-align: justify;">${summary}</p>
            ` : ''}

            <div class="section-title">Professional Experience</div>
            ${experience.map(exp => `
              <div class="item-block">
                <div style="font-weight: bold; font-size: 9.5pt;">${exp.role}</div>
                <div style="font-style: italic; font-size: 8.5pt; color: #444; margin-bottom: 2px;">
                  ${exp.company} | ${exp.period} ${exp.location ? `(${exp.location})` : ''}
                </div>
                <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (activeTmpl === 'modern-two') {
      templateSpecificStyles = `
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          color: #0f172a; 
          line-height: 1.42; 
          font-size: 9pt; 
          padding: 0.35in; 
          margin: 0;
        }
        .wrapper { 
          display: grid; 
          grid-template-columns: 2.2in 1fr; 
          gap: 20px; 
        }
        .side-panel { 
          background: #f8fafc; 
          padding: 14px; 
          border-radius: 6px; 
          border: 1px solid #e2e8f0; 
        }
        .name { 
          font-size: 17pt; 
          font-weight: 800; 
          color: #0f172a; 
          line-height: 1.1; 
        }
        .title { 
          font-size: 10pt; 
          font-weight: 600; 
          color: #0068f9; 
          margin-top: 3px; 
          margin-bottom: 10px; 
        }
        .section-h { 
          font-size: 9pt; 
          font-weight: 700; 
          text-transform: uppercase; 
          color: #475569; 
          letter-spacing: 0.5px; 
          margin-top: 10px; 
          margin-bottom: 4px; 
          border-bottom: 1px solid #cbd5e1; 
          padding-bottom: 2px; 
        }
        .main-h { 
          font-size: 10pt; 
          font-weight: 700; 
          text-transform: uppercase; 
          color: #0f172a; 
          letter-spacing: 0.5px; 
          margin-top: 10px; 
          margin-bottom: 6px; 
          border-bottom: 2px solid #0068f9; 
          padding-bottom: 2px; 
        }
        .skill-tag { 
          display: inline-block; 
          background: #e0e7ff; 
          color: #3730a3; 
          font-size: 8pt; 
          font-weight: 600; 
          padding: 2px 5px; 
          border-radius: 3px; 
          margin: 1.5px 1.5px 1.5px 0; 
        }
        .item-block {
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        ul { 
          margin: 3px 0 6px 14px; 
          padding: 0; 
        }
        li { 
          margin-bottom: 2px; 
          color: #334155; 
          font-size: 8.5pt;
        }
      `;

      renderedHtml = `
        <div class="wrapper">
          <div class="side-panel">
            <div class="name">${fullName}</div>
            <div class="title">${title}</div>

            <div class="section-h">Contact</div>
            <p style="font-size: 8pt; line-height: 1.5; margin: 3px 0; color: #475569;">
              ✉ ${contact.email}<br/>
              ☎ ${contact.phone}<br/>
              ⚲ ${contact.location}<br/>
              ${contact.linkedin ? '🔗 ' + contact.linkedin + '<br/>' : ''}
              ${contact.github ? '🐙 ' + contact.github : ''}
            </p>

            <div class="section-h">Skills</div>
            <div style="margin-top: 3px;">
              ${skills.technical.map(s => `<span class="skill-tag">${s}</span>`).join(' ')}
              ${skills.tools.map(s => `<span class="skill-tag" style="background:#f1f5f9;color:#334155;">${s}</span>`).join(' ')}
            </div>

            <div class="section-h">Education</div>
            ${education.map(edu => `
              <div style="font-size: 8pt; margin-bottom: 4px;">
                <strong>${edu.degree}</strong><br/>
                <span style="color: #64748b;">${edu.institution} (${edu.year})</span>
              </div>
            `).join('')}
          </div>

          <div>
            ${summary ? `
              <div class="main-h" style="margin-top:0;">Profile Summary</div>
              <p style="margin: 0 0 8px 0; color: #334155; font-size: 8.5pt;">${summary}</p>
            ` : ''}

            <div class="main-h">Professional Experience</div>
            ${experience.map(exp => `
              <div class="item-block">
                <div style="display: flex; justify-content: space-between; font-weight: 700; color: #0f172a; font-size: 9pt;">
                  <span>${exp.role}</span>
                  <span style="color: #64748b; font-weight: normal; font-size: 8pt;">${exp.period}</span>
                </div>
                <div style="color: #0068f9; font-weight: 600; font-size: 8.5pt;">${exp.company} ${exp.location ? '• ' + exp.location : ''}</div>
                <ul>${exp.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fullName} - Tailored Resume (${activeTmpl})</title>
          <style>
            @page { 
              size: letter; 
              margin: 0; 
            }
            * { 
              box-sizing: border-box; 
            }
            ${templateSpecificStyles}
            @media print {
              html, body {
                width: 8.5in;
                min-height: 11in;
              }
            }
          </style>
        </head>
        <body>
          ${renderedHtml}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-[#121722]/50 backdrop-blur-xs z-[210] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-in fade-in duration-200">
      <div className="bg-[#faf9f7] rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#efefef]">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-[#efefef] shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#121722]">Resume Builder & PDF Export</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f1ff] text-[#0068f9] border border-[#0068f9]/20">
                  4 ATS Templates
                </span>
              </div>
              <p className="text-xs text-[#777c86]">
                Tailored for {targetRole || 'Target Role'} {companyName ? `at ${companyName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${activeTab === 'preview' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
              >
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${activeTab === 'edit' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
              >
                Edit Content
              </button>
            </div>

            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#efefef] hover:bg-[#faf9f7] text-[#121722] text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#0068f9] text-white text-xs font-semibold rounded-full hover:bg-[#024bb1] transition-all shadow-2xs cursor-pointer"
            >
              <Printer size={15} />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#a5a5a5] hover:text-[#121722] hover:bg-[#efefef] rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main View Area */}
          {activeTab === 'edit' ? (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6 pb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#121722]">Edit Tailored Resume Content</h3>
                    <p className="text-xs text-[#777c86] mt-1">
                      Customize contact details, summary, experience bullet points, and skills before exporting to PDF.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="px-4 py-2 bg-[#0068f9] text-white text-xs font-semibold rounded-full hover:bg-[#024bb1] transition-all cursor-pointer shadow-2xs"
                  >
                    View in Live Canvas
                  </button>
                </div>

                {/* Candidate Information Card */}
                <div className="bg-white rounded-2xl border border-[#efefef] p-5 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-[#121722] uppercase tracking-wider text-[#777c86] border-b border-[#efefef] pb-2">
                    1. Contact & Header
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">Full Name</label>
                      <input
                        type="text"
                        value={resumeData.fullName}
                        onChange={e => setResumeData({ ...resumeData, fullName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">Professional Title</label>
                      <input
                        type="text"
                        value={resumeData.title}
                        onChange={e => setResumeData({ ...resumeData, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">Email</label>
                      <input
                        type="text"
                        value={resumeData.contact.email}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, email: e.target.value } })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">Phone</label>
                      <input
                        type="text"
                        value={resumeData.contact.phone}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, phone: e.target.value } })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">Location</label>
                      <input
                        type="text"
                        value={resumeData.contact.location}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, location: e.target.value } })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#121722] mb-1">LinkedIn / Portfolio</label>
                      <input
                        type="text"
                        value={resumeData.contact.linkedin || ''}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, linkedin: e.target.value } })}
                        className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="bg-white rounded-2xl border border-[#efefef] p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-[#121722] uppercase tracking-wider text-[#777c86] border-b border-[#efefef] pb-2">
                    2. Professional Summary
                  </h4>
                  <textarea
                    rows={4}
                    value={resumeData.summary}
                    onChange={e => setResumeData({ ...resumeData, summary: e.target.value })}
                    className="w-full p-3 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Core Competencies / Skills */}
                <div className="bg-white rounded-2xl border border-[#efefef] p-5 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-[#121722] uppercase tracking-wider text-[#777c86] border-b border-[#efefef] pb-2">
                    3. Skills & Competencies (Comma Separated)
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#121722] mb-1">Technical Skills & Frameworks</label>
                    <input
                      type="text"
                      value={resumeData.skills.technical.join(', ')}
                      onChange={e => setResumeData({
                        ...resumeData,
                        skills: { ...resumeData.skills, technical: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#121722] mb-1">Developer Tools & Platforms</label>
                    <input
                      type="text"
                      value={resumeData.skills.tools.join(', ')}
                      onChange={e => setResumeData({
                        ...resumeData,
                        skills: { ...resumeData.skills, tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#121722] mb-1">Domain Knowledge & Methodologies</label>
                    <input
                      type="text"
                      value={resumeData.skills.domain.join(', ')}
                      onChange={e => setResumeData({
                        ...resumeData,
                        skills: { ...resumeData.skills, domain: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full px-3 py-2 text-xs border border-[#efefef] rounded-xl focus:ring-2 focus:ring-[#0068f9] outline-none"
                    />
                  </div>
                </div>

                {/* Work Experience */}
                <div className="bg-white rounded-2xl border border-[#efefef] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-2">
                    <h4 className="text-xs font-bold text-[#121722] uppercase tracking-wider text-[#777c86]">
                      4. Work Experience
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="px-2.5 py-1 bg-[#f0f5ff] text-[#0068f9] hover:bg-[#e0edff] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Role</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {resumeData.experience.map((exp, expIdx) => (
                      <div key={expIdx} className="p-4 bg-[#faf9f7] rounded-xl border border-[#efefef] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#121722]">Experience #{expIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(expIdx)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#525866] mb-1">Job Title</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={e => handleUpdateExperience(expIdx, 'role', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#525866] mb-1">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={e => handleUpdateExperience(expIdx, 'company', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#525866] mb-1">Location</label>
                            <input
                              type="text"
                              value={exp.location || ''}
                              onChange={e => handleUpdateExperience(expIdx, 'location', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#525866] mb-1">Dates / Period</label>
                            <input
                              type="text"
                              value={exp.period}
                              onChange={e => handleUpdateExperience(expIdx, 'period', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                            />
                          </div>
                        </div>

                        {/* Bullet Points */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-[#121722]">Quantified Bullet Points</label>
                            <button
                              type="button"
                              onClick={() => handleAddBullet(expIdx)}
                              className="text-[11px] text-[#0068f9] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <Plus size={11} /> Add Bullet
                            </button>
                          </div>
                          {exp.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={e => handleUpdateBullet(expIdx, bIdx, e.target.value)}
                                className="flex-1 p-2 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none resize-none leading-relaxed"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveBullet(expIdx, bIdx)}
                                className="text-[#a5a5a5] hover:text-red-500 p-1 transition-colors mt-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-[#efefef] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-2">
                    <h4 className="text-xs font-bold text-[#121722] uppercase tracking-wider text-[#777c86]">
                      5. Education
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="px-2.5 py-1 bg-[#f0f5ff] text-[#0068f9] hover:bg-[#e0edff] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Degree</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {resumeData.education.map((edu, eduIdx) => (
                      <div key={eduIdx} className="p-3 bg-[#faf9f7] rounded-xl border border-[#efefef] grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525866] mb-1">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={e => handleUpdateEducation(eduIdx, 'degree', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#525866] mb-1">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={e => handleUpdateEducation(eduIdx, 'institution', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-[#525866] mb-1">Year</label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={e => handleUpdateEducation(eduIdx, 'year', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#efefef] rounded-lg focus:ring-2 focus:ring-[#0068f9] outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(eduIdx)}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors mb-0.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="px-6 py-2.5 bg-[#0068f9] text-white text-xs font-semibold rounded-full hover:bg-[#024bb1] transition-all cursor-pointer shadow-2xs"
                  >
                    Save Changes & Preview
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live Preview Mode */
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              
              {/* Left Selector Sidebar */}
              <div className="w-full md:w-72 bg-white border-r border-[#efefef] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#777c86]">
                    Choose Layout Template
                  </span>

                  <div className="space-y-2">
                    {RESUME_TEMPLATES.map(tmpl => {
                      const isSelected = selectedTemplate === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          onClick={() => setSelectedTemplate(tmpl.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                            isSelected
                              ? 'bg-[#f4f8ff] border-[#0068f9] shadow-2xs ring-1 ring-[#0068f9]'
                              : 'bg-white border-[#efefef] hover:bg-[#faf9f7]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#121722]">{tmpl.name}</span>
                            {isSelected && <Check size={14} className="text-[#0068f9]" />}
                          </div>
                          <span className="text-[11px] text-[#777c86] mt-1 line-clamp-2 leading-relaxed">{tmpl.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Paper Canvas Preview */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto flex justify-center bg-[#f4f5f6] custom-scrollbar">
                <div className="w-full max-w-3xl bg-white shadow-md border border-[#e2e8f0] p-8 sm:p-12 min-h-[11in] rounded-sm text-[#121722]">
                  
                  {/* Template 1: Classic Single Column (Resume Matcher LaTeX Style) */}
                  {selectedTemplate === 'classic-single' && (
                    <div className="font-serif space-y-4 text-xs leading-relaxed">
                      <div className="text-center border-b-2 border-black pb-3">
                        <h1 className="text-2xl font-bold uppercase tracking-wider text-black">{resumeData.fullName}</h1>
                        <p className="text-sm italic text-gray-800 mt-0.5">{resumeData.title}</p>
                        <p className="text-[11px] text-gray-700 mt-1">
                          {[resumeData.contact.email, resumeData.contact.phone, resumeData.contact.location, resumeData.contact.linkedin, resumeData.contact.github].filter(Boolean).join('  |  ')}
                        </p>
                      </div>

                      {resumeData.summary && (
                        <div>
                          <h3 className="font-bold text-xs uppercase border-b border-gray-500 pb-1 mb-1.5 tracking-wide">Professional Summary</h3>
                          <p className="text-gray-800 text-justify">{resumeData.summary}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold text-xs uppercase border-b border-gray-500 pb-1 mb-1.5 tracking-wide">Technical Skills</h3>
                        <p className="text-gray-800">
                          {resumeData.skills.technical.length > 0 && <><strong>Languages & Frameworks:</strong> {resumeData.skills.technical.join(', ')}<br/></>}
                          {resumeData.skills.tools.length > 0 && <><strong>Developer Tools:</strong> {resumeData.skills.tools.join(', ')}<br/></>}
                          {resumeData.skills.domain.length > 0 && <><strong>Domain Knowledge:</strong> {resumeData.skills.domain.join(', ')}</>}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-bold text-xs uppercase border-b border-gray-500 pb-1 mb-2 tracking-wide">Work Experience</h3>
                        {resumeData.experience.map((exp, i) => (
                          <div key={i} className="mb-3.5">
                            <div className="flex justify-between font-bold text-gray-900">
                              <span>{exp.company}</span>
                              <span className="font-normal">{exp.location || ''}</span>
                            </div>
                            <div className="flex justify-between italic text-gray-700 text-[11px] mb-1">
                              <span>{exp.role}</span>
                              <span>{exp.period}</span>
                            </div>
                            <ul className="list-disc ml-5 space-y-1 text-gray-800">
                              {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="font-bold text-xs uppercase border-b border-gray-500 pb-1 mb-1.5 tracking-wide">Education</h3>
                        {resumeData.education.map((edu, i) => (
                          <div key={i} className="flex justify-between text-gray-900 mb-1">
                            <div><strong>${edu.institution}</strong> — ${edu.degree} {edu.details ? `(${edu.details})` : ''}</div>
                            <div>{edu.year}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template 2: Modern Single Column */}
                  {selectedTemplate === 'modern-single' && (
                    <div className="font-sans space-y-5 text-xs leading-relaxed">
                      <div className="border-b-2 border-[#0068f9] pb-4">
                        <h1 className="text-2xl font-black text-[#0f172a]">{resumeData.fullName}</h1>
                        <p className="text-sm font-bold text-[#0068f9] mt-0.5">{resumeData.title}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-[#64748b] mt-2">
                          {[resumeData.contact.email, resumeData.contact.phone, resumeData.contact.location, resumeData.contact.linkedin].filter(Boolean).map((c, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded font-medium">{c}</span>
                          ))}
                        </div>
                      </div>

                      {resumeData.summary && (
                        <div>
                          <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-[#0f172a] mb-1 flex items-center gap-2">
                            <span>Summary</span>
                            <span className="flex-1 h-[1px] bg-slate-200" />
                          </h3>
                          <p className="text-[#334155]">{resumeData.summary}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-[#0f172a] mb-2 flex items-center gap-2">
                          <span>Skills & Competencies</span>
                          <span className="flex-1 h-[1px] bg-slate-200" />
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.skills.technical.concat(resumeData.skills.tools, resumeData.skills.domain).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#f1f5f9] text-[#1e293b] font-medium rounded text-[11px] border border-slate-200/60">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-[#0f172a] mb-2.5 flex items-center gap-2">
                          <span>Experience</span>
                          <span className="flex-1 h-[1px] bg-slate-200" />
                        </h3>
                        {resumeData.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between font-bold text-[#0f172a]">
                              <span>{exp.role}</span>
                              <span className="text-[#64748b] font-normal text-[11px]">{exp.period}</span>
                            </div>
                            <div className="text-[#0068f9] font-semibold text-[11px] mb-1">{exp.company} {exp.location ? `• ${exp.location}` : ''}</div>
                            <ul className="list-disc ml-5 space-y-1 text-[#334155]">
                              {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-[#0f172a] mb-2 flex items-center gap-2">
                          <span>Education</span>
                          <span className="flex-1 h-[1px] bg-slate-200" />
                        </h3>
                        {resumeData.education.map((edu, i) => (
                          <div key={i} className="flex justify-between text-xs mb-1">
                            <div><strong>{edu.degree}</strong> — {edu.institution} {edu.details ? <span className="text-slate-500">({edu.details})</span> : ''}</div>
                            <div className="text-slate-500">{edu.year}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template 3: Classic Two Column */}
                  {selectedTemplate === 'classic-two' && (
                    <div className="font-serif text-xs leading-relaxed">
                      <div className="border-b-2 border-black pb-3 mb-4">
                        <h1 className="text-2xl font-bold uppercase">{resumeData.fullName}</h1>
                        <p className="text-sm italic text-gray-700">{resumeData.title}</p>
                      </div>
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-4 border-r border-gray-300 pr-4 space-y-4 text-[11px]">
                          <div>
                            <h4 className="font-bold uppercase border-b border-gray-400 pb-1 mb-1">Contact</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {resumeData.contact.email}<br/>
                              {resumeData.contact.phone}<br/>
                              {resumeData.contact.location}<br/>
                              {resumeData.contact.linkedin || ''}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold uppercase border-b border-gray-400 pb-1 mb-1">Skills</h4>
                            <p className="text-gray-700 leading-relaxed">
                              <strong>Technical:</strong><br/>{resumeData.skills.technical.join(', ')}<br/><br/>
                              <strong>Tools:</strong><br/>{resumeData.skills.tools.join(', ')}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold uppercase border-b border-gray-400 pb-1 mb-1">Education</h4>
                            {resumeData.education.map((edu, i) => (
                              <div key={i} className="mb-2">
                                <strong>{edu.degree}</strong><br/>
                                <span className="text-gray-600">{edu.institution} ({edu.year})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-8 space-y-4">
                          {resumeData.summary && (
                            <div>
                              <h4 className="font-bold uppercase border-b border-gray-400 pb-1 mb-1">Profile</h4>
                              <p className="text-gray-800 text-justify">{resumeData.summary}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold uppercase border-b border-gray-400 pb-1 mb-2">Experience</h4>
                            {resumeData.experience.map((exp, i) => (
                              <div key={i} className="mb-3">
                                <div className="font-bold text-gray-900">{exp.role}</div>
                                <div className="text-[11px] italic text-gray-600 mb-1">{exp.company} • {exp.period}</div>
                                <ul className="list-disc ml-5 space-y-1 text-gray-800">
                                  {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Template 4: Modern Two Column */}
                  {selectedTemplate === 'modern-two' && (
                    <div className="font-sans text-xs leading-relaxed">
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-[11px]">
                          <div>
                            <h1 className="text-lg font-black text-slate-900 leading-tight">{resumeData.fullName}</h1>
                            <p className="font-bold text-[#0068f9] mt-0.5">{resumeData.title}</p>
                          </div>
                          <div>
                            <h4 className="font-bold uppercase text-slate-500 tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5">Contact</h4>
                            <p className="text-slate-600 leading-relaxed">
                              ✉ {resumeData.contact.email}<br/>
                              ☎ {resumeData.contact.phone}<br/>
                              ⚲ {resumeData.contact.location}<br/>
                              {resumeData.contact.linkedin ? '🔗 ' + resumeData.contact.linkedin : ''}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold uppercase text-slate-500 tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5">Tech Stack</h4>
                            <div className="flex flex-wrap gap-1">
                              {resumeData.skills.technical.map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-[#0068f9] font-semibold rounded text-[10px]">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold uppercase text-slate-500 tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5">Education</h4>
                            {resumeData.education.map((edu, i) => (
                              <div key={i} className="mb-2 text-slate-700">
                                <strong>{edu.degree}</strong><br/>
                                <span className="text-slate-500">{edu.institution} ({edu.year})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-8 space-y-4">
                          {resumeData.summary && (
                            <div>
                              <h4 className="font-bold uppercase tracking-wider text-slate-900 border-b-2 border-[#0068f9] pb-1 mb-1 text-[11px]">Profile Summary</h4>
                              <p className="text-slate-700">{resumeData.summary}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold uppercase tracking-wider text-slate-900 border-b-2 border-[#0068f9] pb-1 mb-2 text-[11px]">Experience</h4>
                            {resumeData.experience.map((exp, i) => (
                              <div key={i} className="mb-4">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{exp.role}</span>
                                  <span className="text-slate-500 font-normal">{exp.period}</span>
                                </div>
                                <div className="text-[#0068f9] font-semibold text-[11px] mb-1">{exp.company}</div>
                                <ul className="list-disc ml-5 space-y-1 text-slate-700">
                                  {exp.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
