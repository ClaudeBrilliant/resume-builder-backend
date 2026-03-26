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

      // Optionally upload to S3
      if (this.bucketName) {
        await this.uploadToS3(resume.id, pdfBuffer);
      }

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private generateHtml(resume: Resume & { template?: any }): string {
    // This is a basic HTML template - you would customize based on your template structure
    const content = resume.content as any;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #34495e;
              margin-top: 20px;
            }
            .section {
              margin-bottom: 25px;
            }
            .contact-info {
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <h1>${content.name || resume.title}</h1>
          ${content.email ? `<div class="contact-info">Email: ${content.email}</div>` : ''}
          ${content.phone ? `<div class="contact-info">Phone: ${content.phone}</div>` : ''}
          ${content.summary ? `<div class="section"><h2>Summary</h2><p>${content.summary}</p></div>` : ''}
          ${content.experience ? `<div class="section"><h2>Experience</h2>${this.formatExperience(content.experience)}</div>` : ''}
          ${content.education ? `<div class="section"><h2>Education</h2>${this.formatEducation(content.education)}</div>` : ''}
          ${content.skills ? `<div class="section"><h2>Skills</h2>${this.formatSkills(content.skills)}</div>` : ''}
        </body>
      </html>
    `;
  }

  private formatExperience(experience: any): string {
    if (!Array.isArray(experience)) return '';
    return experience
      .map(
        (exp) => `
        <div style="margin-bottom: 15px;">
          <strong>${exp.title || ''}</strong> - ${exp.company || ''}<br>
          <em>${exp.startDate || ''} - ${exp.endDate || 'Present'}</em>
          ${exp.description ? `<p>${exp.description}</p>` : ''}
        </div>
      `,
      )
      .join('');
  }

  private formatEducation(education: any): string {
    if (!Array.isArray(education)) return '';
    return education
      .map(
        (edu) => `
        <div style="margin-bottom: 15px;">
          <strong>${edu.degree || ''}</strong> - ${edu.institution || ''}<br>
          <em>${edu.graduationDate || ''}</em>
        </div>
      `,
      )
      .join('');
  }

  private formatSkills(skills: any): string {
    if (Array.isArray(skills)) {
      return skills.join(', ');
    }
    return skills || '';
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

