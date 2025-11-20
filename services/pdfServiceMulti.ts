import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GroupedItemsByLocation, PickupRequestPDF, PDFGenerationOptions, SelectedItem } from '../types-pdf';
import { LOCATION_ADDRESSES } from '../constants';

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

  private addHeader(title: string): void {
    this.doc.setFillColor(30, 58, 138); // Bleu foncé
    this.doc.rect(0, 0, 210, 30, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 105, 20, { align: 'center' });
    this.doc.setFont('helvetica', 'normal');
  }

  private addContactInfo(request: PickupRequestPDF): void {
    let y = 40;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informations de demande', 14, y);
    y += 8;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    const info = [
      { label: 'Numéro BC', value: request.bcNumber },
      { label: 'Nom du contact', value: request.contactName },
      { label: 'Téléphone', value: request.contactPhone },
      { label: 'Date', value: new Date(request.date).toLocaleDateString('fr-CA') },
      { label: 'ID de demande', value: request.id },
    ];

    info.forEach(item => {
      if (item.value) {
        this.doc.text(`${item.label}: ${item.value}`, 14, y);
        y += 7;
      }
    });

    if (request.notes && request.notes.trim()) {
      y += 3; // Espace avant les notes
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Notes générales:', 14, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      const splitNotes = this.doc.splitTextToSize(request.notes, 182);
      this.doc.text(splitNotes, 14, y);
    }
  }

  private addItemsTable(groupedItems: GroupedItemsByLocation): number {
    let y = (this.doc as any).lastAutoTable?.finalY || 95;

    Object.entries(groupedItems).forEach(([location, locationData], index) => {
      const items = Array.isArray(locationData) ? locationData : locationData.items;
      const comments = !Array.isArray(locationData) ? locationData.comments : null;

      if (items.length === 0) return; // Ne pas afficher le lieu s'il n'y a pas d'articles

      if (y > 250) {
        this.doc.addPage();
        y = 20;
      }

      y += 10;
      this.doc.setFillColor(59, 130, 246); // Bleu
      this.doc.roundedRect(14, y, 182, 10, 2, 2, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`📍 Lieu ${index + 1}: ${location}`, 18, y + 7);
      y += 13;

      const addressInfo = LOCATION_ADDRESSES[location];
      if (addressInfo) {
        this.doc.setTextColor(80, 80, 80);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Adresse: ${addressInfo.fullAddress}`, 18, y);
        y += 7;
      }

      if (comments && comments.trim()) {
        this.doc.setFillColor(255, 250, 205); // Jaune pâle
        this.doc.roundedRect(18, y, 174, 12, 2, 2, 'F');
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('💬 Instructions spécifiques:', 22, y + 5);
        this.doc.setFont('helvetica', 'normal');
        const splitComments = this.doc.splitTextToSize(comments, 166);
        this.doc.text(splitComments, 22, y + 9);
        y += 15;
      }

      const tableData: string[][] = items.map(item => [item.name, item.quantity.toString()]);

      autoTable(this.doc, {
        head: [['Contenant', 'Quantité']],
        body: tableData,
        startY: y,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 142 },
          1: { halign: 'center', cellWidth: 40, fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      y = (this.doc as any).lastAutoTable?.finalY;
    });

    return y;
  }

  private addSummary(request: PickupRequestPDF, lastY: number): void {
    let y = lastY + 15;
    if (y > 260) {
      this.doc.addPage();
      y = 20;
    }

    this.doc.setFillColor(243, 244, 246); // Gris clair
    this.doc.roundedRect(14, y, 182, 20, 3, 3, 'F');
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Résumé', 20, y + 8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.text(`Total de contenants: ${request.totalItems}`, 20, y + 15);
    this.doc.text(`Nombre de lieux: ${request.totalLocations}`, 100, y + 15);
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (this.doc as any).setPage(i);
      const pageHeight = this.doc.internal.pageSize.height;
      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`Document généré le ${new Date().toLocaleString('fr-CA')}`, 105, pageHeight - 10, { align: 'center' });
      this.doc.text(`Page ${i} sur ${pageCount}`, 198, pageHeight - 10, { align: 'right' });
    }
  }

  generatePickupRequestPDF(request: PickupRequestPDF): void {
    this.addHeader('DEMANDE DE RAMASSAGE DE CONTENANTS');
    this.addContactInfo(request);
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
  contactInfo: { name: string; phone: string; notes?: string; bcNumber?: string; },
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
    notes: contactInfo.notes,
    groupedItems,
    totalItems,
    totalLocations: Object.keys(groupedItems).length,
    locationComments: Object.keys(locationComments).length > 0 ? locationComments : undefined
  };
}
