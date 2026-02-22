import PDFDocument from 'pdfkit';
import { Quote } from '@prisma/client';
import https from 'https';
import http from 'http';

interface QuoteWithRelations extends Quote {
  lead: {
    clientName: string;
    clientEmail: string;
    projectTitle: string;
    serviceType?: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
    studioName?: string;
    email: string;
    phone?: string;
    website?: string;
    logo?: string;
    currency: string;
    currencySymbol: string;
    currencyPosition: string;
    numberFormat: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

interface CurrencySettings {
  currencySymbol: string;
  currencyPosition: string;
  numberFormat: string;
}

// Format number based on locale settings
function formatNumber(amount: number, format: string): string {
  const [intPart, decPart] = amount.toFixed(2).split('.');
  
  switch (format) {
    case '1.000,00':
      return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decPart}`;
    case '1 000,00':
      return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${decPart}`;
    default:
      return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decPart}`;
  }
}

// Format currency with proper symbol position
function formatCurrency(amount: number, settings: CurrencySettings): string {
  const formatted = formatNumber(amount, settings.numberFormat);
  if (settings.currencyPosition === 'AFTER') {
    return `${formatted}${settings.currencySymbol}`;
  }
  return `${settings.currencySymbol}${formatted}`;
}

// Download image from URL and return as buffer
async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

export async function generateQuotePDF(quote: QuoteWithRelations): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Get currency settings (quote override or user default)
      const currencySettings: CurrencySettings = {
        currencySymbol: quote.currency ? (quote.currencySymbol || quote.createdBy.currencySymbol) : quote.createdBy.currencySymbol,
        currencyPosition: quote.currencyPosition || quote.createdBy.currencyPosition,
        numberFormat: quote.numberFormat || quote.createdBy.numberFormat,
      };

      // Colors
      const primaryColor = '#7c3aed'; // Violet
      const darkColor = '#1f2937';
      const grayColor = '#6b7280';
      const lightGray = '#f3f4f6';

      // Page dimensions
      const pageWidth = doc.page.width - 100; // margins
      const startX = 50;
      let y = 50;

      // ===== HEADER WITH LOGO =====
      const studioName = quote.createdBy.studioName || `${quote.createdBy.firstName}'s Studio`;
      
      // Try to load logo if available
      let logoLoaded = false;
      if (quote.createdBy.logo) {
        try {
          const logoBuffer = await downloadImage(quote.createdBy.logo);
          if (logoBuffer) {
            doc.image(logoBuffer, startX, y, { width: 60, height: 60 });
            logoLoaded = true;
          }
        } catch (e) {
          console.log('Failed to load logo:', e);
        }
      }

      // Studio name and info
      const headerX = logoLoaded ? startX + 75 : startX;
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor(primaryColor)
         .text(studioName, headerX, y);
      
      y += 30;
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(grayColor);
      
      if (quote.createdBy.email) {
        doc.text(quote.createdBy.email, headerX, y);
        y += 14;
      }
      if (quote.createdBy.phone) {
        doc.text(quote.createdBy.phone, headerX, y);
        y += 14;
      }
      if (quote.createdBy.website) {
        doc.text(quote.createdBy.website, headerX, y);
        y += 14;
      }

      // Quote badge on right
      const quoteBoxWidth = 150;
      const quoteBoxX = startX + pageWidth - quoteBoxWidth;
      doc.rect(quoteBoxX, 50, quoteBoxWidth, 70)
         .fill(primaryColor);
      
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .fillColor('white')
         .text('QUOTE', quoteBoxX, 60, { width: quoteBoxWidth, align: 'center' });
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(quote.quoteNumber, quoteBoxX, 85, { width: quoteBoxWidth, align: 'center' });
      
      doc.fontSize(9)
         .text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, quoteBoxX, 102, { width: quoteBoxWidth, align: 'center' });

      y = Math.max(y, 140);

      // Divider line
      doc.moveTo(startX, y)
         .lineTo(startX + pageWidth, y)
         .strokeColor(lightGray)
         .lineWidth(2)
         .stroke();
      
      y += 25;

      // ===== CLIENT & PROJECT INFO =====
      const halfWidth = (pageWidth - 20) / 2;

      // Bill To section
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(grayColor)
         .text('BILL TO', startX, y);
      
      y += 15;
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(darkColor)
         .text(quote.lead.clientName, startX, y);
      
      y += 16;
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(grayColor)
         .text(quote.lead.clientEmail, startX, y);

      // Project section (right side)
      const projectX = startX + halfWidth + 20;
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(grayColor)
         .text('PROJECT', projectX, y - 31);
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(darkColor)
         .text(quote.lead.projectTitle, projectX, y - 16);
      
      if (quote.lead.serviceType) {
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(grayColor)
           .text(quote.lead.serviceType.replace('_', ' ').toLowerCase(), projectX, y);
      }

      y += 40;

      // ===== LINE ITEMS TABLE =====
      // Table header
      const colWidths = {
        description: pageWidth * 0.5,
        qty: 50,
        price: 80,
        total: pageWidth - (pageWidth * 0.5) - 50 - 80,
      };

      // Header background
      doc.rect(startX, y, pageWidth, 25)
         .fill(primaryColor);

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('white');
      
      let colX = startX + 10;
      doc.text('Description', colX, y + 8);
      colX += colWidths.description;
      doc.text('Qty', colX, y + 8, { width: colWidths.qty, align: 'center' });
      colX += colWidths.qty;
      doc.text('Price', colX, y + 8, { width: colWidths.price, align: 'right' });
      colX += colWidths.price;
      doc.text('Total', colX, y + 8, { width: colWidths.total - 10, align: 'right' });

      y += 25;

      // Line items
      const lineItems = quote.lineItems as Array<{ description: string; quantity: number; price: number; total: number }>;
      
      lineItems.forEach((item, index) => {
        const rowHeight = 30;
        const bgColor = index % 2 === 0 ? 'white' : lightGray;
        
        doc.rect(startX, y, pageWidth, rowHeight).fill(bgColor);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(darkColor);
        
        colX = startX + 10;
        doc.text(item.description, colX, y + 10, { width: colWidths.description - 20 });
        colX += colWidths.description;
        doc.text(item.quantity.toString(), colX, y + 10, { width: colWidths.qty, align: 'center' });
        colX += colWidths.qty;
        doc.text(formatCurrency(item.price, currencySettings), colX, y + 10, { width: colWidths.price, align: 'right' });
        colX += colWidths.price;
        doc.font('Helvetica-Bold')
           .text(formatCurrency(item.total, currencySettings), colX, y + 10, { width: colWidths.total - 10, align: 'right' });
        
        y += rowHeight;
      });

      // Table border
      doc.rect(startX, y - (lineItems.length * 30) - 25, pageWidth, (lineItems.length * 30) + 25)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke();

      y += 20;

      // ===== TOTALS =====
      const totalsX = startX + pageWidth - 200;
      const totalsWidth = 200;

      // Subtotal
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(grayColor)
         .text('Subtotal', totalsX, y);
      doc.fillColor(darkColor)
         .text(formatCurrency(quote.subtotal, currencySettings), totalsX + 80, y, { width: totalsWidth - 80, align: 'right' });
      y += 18;

      // Tax
      if (quote.tax > 0) {
        doc.fillColor(grayColor)
           .text(`Tax (${quote.tax}%)`, totalsX, y);
        doc.fillColor(darkColor)
           .text(formatCurrency(quote.taxAmount, currencySettings), totalsX + 80, y, { width: totalsWidth - 80, align: 'right' });
        y += 18;
      }

      // Total
      doc.rect(totalsX - 10, y - 5, totalsWidth + 20, 35)
         .fill(primaryColor);
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('white')
         .text('TOTAL', totalsX, y + 5);
      doc.fontSize(16)
         .text(formatCurrency(quote.total, currencySettings), totalsX + 80, y + 3, { width: totalsWidth - 80, align: 'right' });

      y += 50;

      // ===== PAYMENT TERMS & VALIDITY =====
      const termsLabels: Record<string, string> = {
        FULL_UPFRONT: 'Full Payment Upfront',
        DEPOSIT_50: '50% Deposit + 50% on Completion',
        NET_15: 'Net 15 Days',
        NET_30: 'Net 30 Days',
        NET_60: 'Net 60 Days',
        CUSTOM: 'Custom Terms',
      };

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(grayColor)
         .text('PAYMENT TERMS', startX, y);
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(darkColor)
         .text(termsLabels[quote.paymentTerms] || quote.paymentTerms, startX, y + 15);

      doc.font('Helvetica-Bold')
         .fillColor(grayColor)
         .text('VALID UNTIL', startX + 200, y);
      doc.font('Helvetica')
         .fillColor(darkColor)
         .text(new Date(quote.validUntil).toLocaleDateString('en-US', { 
           weekday: 'long', 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }), startX + 200, y + 15);

      y += 50;

      // ===== TERMS & CONDITIONS =====
      if (quote.terms) {
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(grayColor)
           .text('TERMS & CONDITIONS', startX, y);
        
        y += 18;
        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(grayColor)
           .text(quote.terms, startX, y, { width: pageWidth, lineGap: 3 });
      }

      // ===== FOOTER =====
      doc.fontSize(8)
         .fillColor(grayColor)
         .text(
           `Generated by ${studioName} • ${new Date().toLocaleDateString()}`,
           startX,
           doc.page.height - 50,
           { width: pageWidth, align: 'center' }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
