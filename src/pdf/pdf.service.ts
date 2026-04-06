import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async generatePdf(resume: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      // opt-in to the new headless implementation to avoid deprecation warnings
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

        try {
      const page = await browser.newPage();

      // Generate HTML from resume content and template
      const html = this.generateHtml(resume);

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });


      return pdfBuffer;
        } catch (err) {
            this.logger.error('Failed to generate PDF', err as any);
            throw err;
        } finally {
            await browser.close();
        }
  }

    private generateHtml(resume: any): string {
    const content = resume.content as any;
    const personalInfo = content.personalInfo || {};
    const experiences = content.experience || [];
    const educations = content.education || [];
    const projects = content.projects || [];
    const skills = content.skills || [];
    
    // Default to modern if not specified
    const templateCategory = resume.template?.category?.toLowerCase() || 'modern';

    let bodyContent = '';
    if (templateCategory === 'professional') {
      bodyContent = this.renderProfessional(personalInfo, experiences, educations, projects, skills);
    } else if (templateCategory === 'creative') {
      bodyContent = this.renderCreative(personalInfo, experiences, educations, projects, skills);
    } else {
      bodyContent = this.renderModern(personalInfo, experiences, educations, projects, skills);
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            html, body {
              font-family: 'Inter', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body class="bg-white">
          ${bodyContent}
        </body>
      </html>
    `;
  }

    private renderModern(personalInfo: any, experiences: any[], educations: any[], projects: any[], skills: any[]): string {
    return `
      <div class="space-y-6">
          <div class="border-b-2 border-teal-600/40 pb-4">
              <h1 class="text-3xl font-bold text-slate-900">${personalInfo.fullName || personalInfo.name || "Your Name"}</h1>
              <p class="text-lg text-teal-600 font-medium mt-1">${personalInfo.title || "Professional Title"}</p>
              <div class="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
                  ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
                  ${personalInfo.phone ? `<span>• ${personalInfo.phone}</span>` : ''}
                  ${personalInfo.location ? `<span>• ${personalInfo.location}</span>` : ''}
              </div>
          </div>

          ${personalInfo.summary ? `
          <div>
              <h2 class="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Professional Summary</h2>
              <p class="text-sm text-slate-700 leading-relaxed">${personalInfo.summary}</p>
          </div>` : ''}

          ${experiences.length > 0 ? `
          <div>
              <h2 class="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Work Experience</h2>
              <div class="space-y-4">
                  ${experiences.map(exp => `
                  <div>
                      <div class="flex justify-between items-start mb-1">
                          <div>
                              <h3 class="font-semibold text-slate-900">${exp.position || exp.title || "Job Title"}</h3>
                              <p class="text-sm text-slate-600">${exp.company || "Company"}</p>
                          </div>
                          <span class="text-xs text-slate-500">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</span>
                      </div>
                      ${exp.bullets && exp.bullets.length > 0 ? `
                      <ul class="mt-2 space-y-1 text-sm text-slate-700">
                          ${exp.bullets.filter((b: string) => b.trim()).map((bullet: string) => `
                          <li class="flex gap-2"><span class="text-teal-600">•</span><span>${bullet}</span></li>
                          `).join('')}
                      </ul>` : ''}
                  </div>`).join('')}
              </div>
          </div>` : ''}

          ${projects.length > 0 ? `
          <div>
              <h2 class="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Projects</h2>
              <div class="space-y-4">
                  ${projects.map(proj => `
                  <div>
                      <div class="flex justify-between items-start mb-1">
                          <h3 class="font-semibold text-slate-900">${proj.name || "Project Name"}</h3>
                          ${proj.link ? `<span class="text-[10px] text-teal-600 font-medium break-all max-w-[200px]">${proj.link}</span>` : ''}
                      </div>
                      <p class="text-sm text-slate-700 leading-relaxed">${proj.description || ''}</p>
                  </div>`).join('')}
              </div>
          </div>` : ''}

          ${educations.length > 0 ? `
          <div>
              <h2 class="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">Education</h2>
              <div class="space-y-3">
                  ${educations.map(edu => `
                  <div class="flex justify-between items-start">
                      <div>
                          <h3 class="font-semibold text-slate-900">${edu.degree || "Degree"}</h3>
                          <p class="text-sm text-slate-600">${edu.school || edu.institution || "School"}</p>
                      </div>
                      <span class="text-xs text-slate-500">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                  </div>`).join('')}
              </div>
          </div>` : ''}

          ${skills.length > 0 ? `
          <div>
              <h2 class="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Skills</h2>
              <div class="flex flex-wrap gap-2">
                  ${skills.map((skill: string) => `
                  <span class="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded border border-teal-100">${skill}</span>
                  `).join('')}
              </div>
          </div>` : ''}
      </div>
    `;
  }

    private renderProfessional(personalInfo: any, experiences: any[], educations: any[], projects: any[], skills: any[]): string {
    return `
      <div class="grid grid-cols-[200px,1fr] gap-8 h-full">
          <div class="bg-slate-50 p-6 border-r border-slate-200" style="min-height: 100vh;">
              <div class="space-y-8">
                  <div>
                      <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Contact</h2>
                      <div class="space-y-3 text-sm text-slate-600">
                          ${personalInfo.email ? `<div class="break-all">${personalInfo.email}</div>` : ''}
                          ${personalInfo.phone ? `<div>${personalInfo.phone}</div>` : ''}
                          ${personalInfo.location ? `<div>${personalInfo.location}</div>` : ''}
                      </div>
                  </div>
                  <div>
                      <h2 class="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Skills</h2>
                      <div class="space-y-2">
                          ${skills.map((skill: string) => `
                          <div class="text-sm text-slate-700">${skill}</div>
                          `).join('')}
                      </div>
                  </div>
              </div>
          </div>

          <div class="space-y-8 pt-6 pr-6">
              <div>
                  <h1 class="text-4xl font-serif font-bold text-slate-900 lowercase tracking-tight italic">${personalInfo.fullName || personalInfo.name || "Your Name"}</h1>
                  <p class="text-sm font-medium text-slate-500 uppercase tracking-widest mt-2">${personalInfo.title || "Professional Title"}</p>
              </div>

              ${personalInfo.summary ? `
              <div class="border-t border-slate-200 pt-6">
                  <p class="text-sm text-slate-700 leading-relaxed italic">${personalInfo.summary}</p>
              </div>` : ''}

              ${experiences.length > 0 ? `
              <div class="space-y-6">
                  <h2 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-900 pb-1">Experience</h2>
                  <div class="space-y-6">
                      ${experiences.map(exp => `
                      <div>
                          <div class="flex justify-between items-baseline">
                              <h3 class="font-bold text-slate-900">${exp.position || exp.title || "Job Title"}</h3>
                              <span class="text-[10px] text-slate-500 uppercase">${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}</span>
                          </div>
                          <p class="text-xs font-semibold text-slate-600 uppercase mb-2">${exp.company || "Company"}</p>
                          ${exp.bullets && exp.bullets.length > 0 ? `
                          <ul class="space-y-1.5 text-xs text-slate-700">
                              ${exp.bullets.filter((b: string) => b.trim()).map((bullet: string) => `
                              <li class="list-disc ml-4">${bullet}</li>
                              `).join('')}
                          </ul>` : ''}
                      </div>`).join('')}
                  </div>
              </div>` : ''}

              ${projects.length > 0 ? `
              <div class="space-y-4">
                  <h2 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-900 pb-1">Projects</h2>
                  ${projects.map(proj => `
                  <div>
                      <div class="flex justify-between items-baseline">
                          <h3 class="font-bold text-slate-900">${proj.name || "Project Name"}</h3>
                          ${proj.link ? `<span class="text-[10px] text-slate-500 italic">${proj.link}</span>` : ''}
                      </div>
                      <p class="text-xs text-slate-700 mt-1 leading-relaxed">${proj.description || ''}</p>
                  </div>`).join('')}
              </div>` : ''}

              ${educations.length > 0 ? `
              <div class="space-y-4">
                  <h2 class="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-900 pb-1">Education</h2>
                  ${educations.map(edu => `
                  <div class="flex justify-between items-baseline">
                      <div>
                          <h3 class="font-bold text-slate-900 italic">${edu.degree || "Degree"}</h3>
                          <p class="text-xs text-slate-600">${edu.school || edu.institution || "School"}</p>
                      </div>
                      <span class="text-[10px] text-slate-500 uppercase">${edu.startDate || ''} – ${edu.endDate || ''}</span>
                  </div>`).join('')}
              </div>` : ''}
          </div>
      </div>
    `;
  }

    private renderCreative(personalInfo: any, experiences: any[], educations: any[], projects: any[], skills: any[]): string {
    return `
      <div class="flex flex-col h-full bg-white relative overflow-hidden">
          <div class="bg-indigo-600 text-white p-10 mb-8 relative">
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <h1 class="text-5xl font-black tracking-tighter mb-2">${personalInfo.fullName || personalInfo.name || "YOUR NAME"}</h1>
              <p class="text-xl font-light tracking-[0.2em] text-indigo-100 uppercase">${personalInfo.title || "CREATIVE PRO"}</p>
          </div>

          <div class="grid grid-cols-[1fr,240px] gap-10 px-6">
              <div class="space-y-10">
                  ${personalInfo.summary ? `
                  <div class="relative">
                      <div class="absolute -left-4 top-0 bottom-0 w-1 bg-indigo-600"></div>
                      <h2 class="text-lg font-bold text-slate-900 mb-3 uppercase tracking-tighter underline decoration-indigo-600 decoration-4 underline-offset-4">Profile</h2>
                      <p class="text-sm text-slate-600 leading-relaxed font-medium">${personalInfo.summary}</p>
                  </div>` : ''}

                  ${experiences.length > 0 ? `
                  <div class="space-y-8">
                      <h2 class="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tighter underline decoration-indigo-600 decoration-4 underline-offset-4">Work History</h2>
                      ${experiences.map(exp => `
                      <div class="grid grid-cols-[100px,1fr] gap-4">
                          <div class="text-[10px] font-bold text-indigo-600 uppercase pt-1">${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</div>
                          <div>
                              <h3 class="font-bold text-slate-900 text-lg leading-tight mb-1">${exp.position || exp.title || "Job Title"}</h3>
                              <p class="text-sm font-bold text-slate-500 mb-3">${exp.company || "Company"}</p>
                              <div class="space-y-2">
                                  ${exp.bullets && exp.bullets.length > 0 ? 
                                    exp.bullets.filter((b: string) => b.trim()).map((bullet: string) => `
                                    <p class="text-xs text-slate-600 leading-snug">• ${bullet}</p>
                                    `).join('') 
                                  : ''}
                              </div>
                          </div>
                      </div>`).join('')}
                  </div>` : ''}

                  ${projects.length > 0 ? `
                  <div class="space-y-8">
                      <h2 class="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tighter underline decoration-indigo-600 decoration-4 underline-offset-4">Portfolio</h2>
                      ${projects.map(proj => `
                      <div class="space-y-2">
                          <div class="flex items-center justify-between">
                              <h3 class="font-bold text-slate-900 text-lg leading-tight">${proj.name || "Project Name"}</h3>
                              ${proj.link ? `<span class="text-[10px] font-bold text-indigo-600">${proj.link}</span>` : ''}
                          </div>
                          <p class="text-xs text-slate-600 leading-relaxed">${proj.description || ''}</p>
                      </div>`).join('')}
                  </div>` : ''}
              </div>

              <div class="space-y-8">
                  <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h2 class="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Contact</h2>
                      <div class="space-y-4 text-xs font-semibold text-slate-500">
                          ${personalInfo.email ? `<div>${personalInfo.email}</div>` : ''}
                          ${personalInfo.phone ? `<div>${personalInfo.phone}</div>` : ''}
                          ${personalInfo.location ? `<div>${personalInfo.location}</div>` : ''}
                      </div>
                  </div>

                  ${skills.length > 0 ? `
                  <div>
                      <h2 class="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Technical Arsenal</h2>
                      <div class="flex flex-wrap gap-2">
                          ${skills.map((skill: string) => `
                          <span class="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">${skill}</span>
                          `).join('')}
                      </div>
                  </div>` : ''}

                  ${educations.length > 0 ? `
                  <div>
                      <h2 class="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Academics</h2>
                      <div class="space-y-4">
                          ${educations.map(edu => `
                          <div>
                              <div class="text-[10px] font-bold text-indigo-600 mb-1">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                              <div class="text-xs font-bold text-slate-900">${edu.degree || "Degree"}</div>
                              <div class="text-[10px] text-slate-500 font-bold">${edu.school || edu.institution || "School"}</div>
                          </div>`).join('')}
                      </div>
                  </div>` : ''}
              </div>
          </div>
      </div>
    `;
  }
}

