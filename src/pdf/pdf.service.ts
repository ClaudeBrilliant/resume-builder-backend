import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { S3 } from '@aws-sdk/client-s3';
import { Resume } from '@prisma/client';

@Injectable()
export class PdfService {
  private s3Client: S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3({
      // Provide a sensible default region to avoid errors when AWS_REGION is missing
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
  }

  async generatePdf(resume: Resume & { template?: any }): Promise<Buffer> {
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

      // Optionally upload to S3 - Disabled as per user request (not implemented yet)
      /*
      if (this.bucketName) {
        await this.uploadToS3(resume.id, pdfBuffer);
      }
      */

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private generateHtml(resume: Resume & { template?: any }): string {
    const content = resume.content as any;
    const personal = content.personalInfo || {};

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 900px;
              margin: 0 auto;
              padding: 40px;
            }
            .header {
              border-bottom: 2px solid #2c3e50;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .name {
              font-size: 28px;
              font-weight: bold;
              color: #2c3e50;
              margin: 0;
            }
            .title {
              font-size: 18px;
              color: #34495e;
              margin: 5px 0;
            }
            .contact-info {
              font-size: 12px;
              color: #7f8c8d;
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              margin-top: 10px;
            }
            h2 {
              font-size: 18px;
              color: #2c3e50;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              margin-top: 25px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section {
              margin-bottom: 20px;
            }
            .item {
              margin-bottom: 15px;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
            }
            .item-sub {
              display: flex;
              justify-content: space-between;
              font-style: italic;
              color: #555;
              font-size: 14px;
            }
            .description {
                margin-top: 5px;
                font-size: 14px;
            }
            .bullets {
              margin-top: 8px;
              padding-left: 20px;
              font-size: 14px;
            }
            .bullets li {
              margin-bottom: 4px;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .skill-tag {
              background: #f4f7f6;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 13px;
              border: 1px solid #e1e8e7;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="name">${personal.fullName || resume.title}</h1>
            ${personal.title ? `<p class="title">${personal.title}</p>` : ''}
            <div class="contact-info">
              ${personal.email ? `<span>${personal.email}</span>` : ''}
              ${personal.phone ? `<span>${personal.phone}</span>` : ''}
              ${personal.location ? `<span>${personal.location}</span>` : ''}
              ${personal.linkedin ? `<span>LinkedIn: ${personal.linkedin}</span>` : ''}
              ${personal.portfolio ? `<span>Portfolio: ${personal.portfolio}</span>` : ''}
            </div>
          </div>

          ${personal.summary ? `<div class="section"><h2>Professional Summary</h2><p>${personal.summary}</p></div>` : ''}
          
          ${content.experience && content.experience.length > 0 ? `<div class="section"><h2>Experience</h2>${this.formatExperience(content.experience)}</div>` : ''}
          
          ${content.education && content.education.length > 0 ? `<div class="section"><h2>Education</h2>${this.formatEducation(content.education)}</div>` : ''}
          
          ${content.projects && content.projects.length > 0 ? `<div class="section"><h2>Projects</h2>${this.formatProjects(content.projects)}</div>` : ''}
          
          ${content.skills && content.skills.length > 0 ? `<div class="section"><h2>Skills</h2><div class="skills-list">${this.formatSkills(content.skills)}</div></div>` : ''}
        </body>
      </html>
    `;
  }

  private formatExperience(experience: any[]): string {
    return experience
      .map(
        (exp) => `
        <div class="item">
          <div class="item-header">
            <span>${exp.position || ''}</span>
            <span>${exp.company || ''}</span>
          </div>
          <div class="item-sub">
            <span>${exp.location || ''}</span>
            <span>${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}</span>
          </div>
          ${exp.description ? `<p class="description">${exp.description}</p>` : ''}
          ${exp.bullets && exp.bullets.length > 0 ? `
            <ul class="bullets">
              ${exp.bullets.map((b: string) => `<li>${b}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `,
      )
      .join('');
  }

  private formatEducation(education: any[]): string {
    return education
      .map(
        (edu) => `
        <div class="item">
          <div class="item-header">
            <span>${edu.degree || ''}${edu.field ? `, ${edu.field}` : ''}</span>
            <span>${edu.institution || ''}</span>
          </div>
          <div class="item-sub">
            <span>${edu.location || ''}</span>
            <span>${edu.startDate || ''} - ${edu.endDate || ''}</span>
          </div>
          ${edu.gpa ? `<p class="description">GPA: ${edu.gpa}</p>` : ''}
        </div>
      `,
      )
      .join('');
  }

  private formatProjects(projects: any[]): string {
    return projects
      .map(
        (proj) => `
        <div class="item">
          <div class="item-header">
            <span>${proj.name || ''}</span>
            ${proj.link ? `<span><a href="${proj.link}">${proj.link}</a></span>` : ''}
          </div>
          ${proj.description ? `<p class="description">${proj.description}</p>` : ''}
        </div>
      `,
      )
      .join('');
  }

  private formatSkills(skills: any): string {
    if (Array.isArray(skills)) {
      return skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
    }
    return skills ? `<span class="skill-tag">${skills}</span>` : '';
  }

  private async uploadToS3(resumeId: string, pdfBuffer: Buffer): Promise<void> {
    if (!this.bucketName) return;

    try {
      await this.s3Client.putObject({
        Bucket: this.bucketName,
        Key: `resumes/${resumeId}.pdf`,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      });
    } catch (error) {
      console.error('Error uploading PDF to S3:', error);
      // Don't throw - PDF generation should still succeed even if S3 upload fails
    }
  }
}

