import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GroupedItemsByLocation, PickupRequestPDF, PDFGenerationOptions, SelectedItem } from '../types-pdf';
import { LOCATION_ADDRESSES } from '../constants';
import logoValdor from '../src/assets/logo_valdor.png';

export class PDFService {
  private doc: jsPDF;
  private readonly defaultOptions: PDFGenerationOptions = {
    includeHeader: true,
    includeContactInfo: true,
    includeNotes: true,
    pageSize: 'a4',
    orientation: 'portrait'
  };

  constructor(options?: Partial<PDFGenerationOptions>) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    this.doc = new jsPDF({
      orientation: mergedOptions.orientation,
      unit: 'mm',
      format: mergedOptions.pageSize
    });
  }

  private async getQRCode(text: string): Promise<string> {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to generate QR code", e);
      return '';
    }
  }

  private addHeader(title: string): void {
    // Professional Header Background
    this.doc.setFillColor(30, 58, 138); // Navy Blue
    this.doc.rect(0, 0, 210, 40, 'F');

    // Logo Area (Placeholder or Actual)
    try {
      this.doc.addImage(logoValdor, 'PNG', 14, 5, 45, 28);
    } catch (e) {
      // Fallback if logo fails
      this.doc.setFontSize(16);
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text("VILLE DE VAL-D'OR", 14, 20);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text("Service de l'Environnement", 14, 26);
    }

    // Title and Badge
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 200, 20, { align: 'right' });

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text("DOCUMENT OFFICIEL", 200, 28, { align: 'right' });
  }

  private async addContactInfo(request: PickupRequestPDF): Promise<void> {
    let y = 50;

    // Two-column layout for "Bill To" (Requester) and "Ship To" (Pickup Info)

    // Left Column: Requester Info
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("DEMANDEUR (CONTACT)", 14, y);

    y += 6;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(request.contactName, 14, y);
    y += 5;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(request.contactPhone, 14, y);
    y += 5;

    if (request.contactAddress) {
      this.doc.text(request.contactAddress, 14, y);
      y += 5;
    }

    if (request.bcNumber) {
      this.doc.text(`BC #: ${request.bcNumber}`, 14, y);
    }

    // Right Column: Request Details & QR Code
    // Moved details to x=90 to give more space for QR code and prevent overlap
    y = 50;
    const detailsX = 90;
    const detailsValueX = 120;

    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("DETAILS DE LA DEMANDE", detailsX, y);

    y += 6;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const details = [
      { label: "Date:", value: new Date(request.date).toLocaleDateString('fr-CA') },
      { label: "ID:", value: request.id },
      { label: "Lieux:", value: request.totalLocations.toString() },
      { label: "Total Items:", value: request.totalItems.toString() }
    ];

    details.forEach(detail => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(detail.label, detailsX, y);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(detail.value, detailsValueX, y);
      y += 5;
    });

    // QR Code - Positioned to the right of details
    const qrCodeUrl = await this.getQRCode(request.id);
    if (qrCodeUrl) {
      // Position at top of details section (y=50), right aligned (x=160)
      this.doc.addImage(qrCodeUrl, 'PNG', 160, 50, 25, 25);
    }

    // Notes Section
    // Ensure notes start below details and QR code
    // Details end approx y=75. QR ends y=75.
    // Start notes at y=85 to have good spacing.
    if (request.notes && request.notes.trim()) {
      y = 85;
      this.doc.setFillColor(245, 247, 250);
      this.doc.setDrawColor(200, 200, 200);
      this.doc.roundedRect(14, y, 182, 15, 2, 2, 'FD');

      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text("NOTES SPECIALES:", 18, y + 5);

      this.doc.setFontSize(10);
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(request.notes, 18, y + 10);

      (this.doc as any).contactInfoFinalY = y + 20;
    } else {
      (this.doc as any).contactInfoFinalY = 85;
    }
  }

  private addItemsTable(groupedItems: GroupedItemsByLocation): number {
    let y = (this.doc as any).contactInfoFinalY || 110;
    const pageHeight = this.doc.internal.pageSize.height;
    const footerHeight = 20; // Space reserved for footer
    const bottomMargin = 20; // Margin from bottom of page

    Object.entries(groupedItems).forEach(([location, locationData], index) => {
      const items = Array.isArray(locationData) ? locationData : locationData.items;
      const comments = !Array.isArray(locationData) ? locationData.comments : null;

      if (items.length === 0) return;

      // Calculate required height for the header block
      let headerHeight = 15; // Base header height (Title + spacing)
      const addressInfo = LOCATION_ADDRESSES[location];
      if (addressInfo) headerHeight += 8;
      if (comments) headerHeight += 8;

      // Check if we need a page break before starting this location
      // We need space for the header + at least one row of the table (approx 15mm)
      if (y + headerHeight + 15 > pageHeight - bottomMargin) {
        this.doc.addPage();
        y = 20;
      }

      y += 5; // Small gap before header

      // Location Header
      this.doc.setFillColor(230, 240, 255);
      // Draw background rect for title
      this.doc.rect(14, y, 182, 8, 'F');

      this.doc.setTextColor(30, 58, 138);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`LIEU ${index + 1}: ${location.toUpperCase()}`, 18, y + 5.5);

      y += 8; // Move past title rect

      if (addressInfo) {
        y += 5;
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(addressInfo.fullAddress, 18, y);
      }

      if (comments) {
        y += 5;
        this.doc.setFontSize(9);
        this.doc.setTextColor(220, 38, 38); // Red for attention
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`NOTE: ${comments}`, 18, y);
      }

      y += 4; // Spacing before table

      const tableData: string[][] = items.map(item => [item.name, item.quantity.toString()]);

      autoTable(this.doc, {
        head: [['DESCRIPTION DU CONTENANT', 'QUANTITÉ']],
        body: tableData,
        startY: y,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [40, 40, 40],
          lineColor: [230, 230, 230],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [30, 58, 138],
          fontStyle: 'bold',
          lineWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: [30, 58, 138]
        },
        columnStyles: {
          0: { cellWidth: 150 },
          1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14, bottom: bottomMargin },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        // Important: If table breaks page, this ensures header is repeated or handled correctly
        showHead: 'everyPage',
        didDrawPage: (data) => {
          // Optional: Add footer or header on new pages if needed, 
          // but our main footer is handled separately.
          // We just need to ensure we don't write over the footer area.
        }
      });

      // Correctly update y for the next iteration
      y = (this.doc as any).lastAutoTable?.finalY || y + 20;
    });

    return y;
  }

  private addSummary(request: PickupRequestPDF, lastY: number): void {
    let y = lastY + 10;
    const pageHeight = this.doc.internal.pageSize.height;
    const bottomMargin = 30; // Larger margin for summary to ensure it doesn't hit footer

    // Keep summary on same page if possible, else new page
    if (y + 20 > pageHeight - bottomMargin) {
      this.doc.addPage();
      y = 20;
    }

    this.doc.setDrawColor(30, 58, 138);
    this.doc.setLineWidth(0.5);
    this.doc.line(120, y, 196, y);
    y += 8;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(30, 58, 138);
    this.doc.text('TOTAL CONTENANTS:', 120, y);
    this.doc.text(request.totalItems.toString(), 196, y, { align: 'right' });
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (this.doc as any).setPage(i);
      const pageHeight = this.doc.internal.pageSize.height;

      // Footer Line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.1);
      this.doc.line(14, pageHeight - 15, 196, pageHeight - 15);

      // Footer Text
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text("Ville de Val-d'Or - Service de l'Environnement", 14, pageHeight - 10);
      this.doc.text(`Généré le ${new Date().toLocaleString('fr-CA')}`, 14, pageHeight - 6);

      this.doc.text(`Page ${i} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
  }

  async generatePickupRequestPDF(request: PickupRequestPDF): Promise<void> {
    this.addHeader('DEMANDE DE RAMASSAGE');
    await this.addContactInfo(request);
    const lastTableY = this.addItemsTable(request.groupedItems);
    this.addSummary(request, lastTableY);
    this.addFooter();
  }

  save(filename: string): void {
    this.doc.save(filename);
  }
  getBlob(): Blob {
    return this.doc.output('blob') as Blob;
  }
  getDataURL(): string {
    return this.doc.output('datauristring') as string;
  }
}

export function groupItemsByLocation(selectedItems: SelectedItem[]): GroupedItemsByLocation {
  return selectedItems.reduce((groups, item) => {
    const location = item.location || 'Non spécifié';
    if (!groups[location]) {
      groups[location] = { items: [], comments: undefined };
    }
    groups[location].items.push(item);
    return groups;
  }, {} as GroupedItemsByLocation);
}

export function createPickupRequestPDF(
  selectedItems: SelectedItem[],
  contactInfo: { name: string; phone: string; notes?: string; bcNumber?: string; contactAddress?: string; },
  groupedItemsWithComments?: Record<string, { items: any[], comments?: string }>
): PickupRequestPDF {
  const allItems = [...selectedItems];
  if (groupedItemsWithComments) {
    Object.values(groupedItemsWithComments).forEach(data => {
      data.items.forEach(item => {
        if (!allItems.some(i => i.id === item.id)) {
          allItems.push(item);
        }
      });
    });
  }

  const groupedItems = groupedItemsWithComments || groupItemsByLocation(allItems);
  const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const locationComments: Record<string, string> = {};
  Object.entries(groupedItems).forEach(([location, data]) => {
    if (!Array.isArray(data) && data.comments) {
      locationComments[location] = data.comments;
    }
  });

  return {
    id: `REQ-${Date.now()}`,
    bcNumber: contactInfo.bcNumber,
    date: new Date().toISOString(),
    contactName: contactInfo.name,
    contactPhone: contactInfo.phone,
    contactAddress: contactInfo.contactAddress,
    notes: contactInfo.notes,
    groupedItems,
    totalItems,
    totalLocations: Object.keys(groupedItems).length,
    locationComments: Object.keys(locationComments).length > 0 ? locationComments : undefined
  };
}
