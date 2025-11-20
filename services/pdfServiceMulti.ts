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

  private addHeader(title: string): void {
    // En-tête avec Logo et Titre
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, 210, 40, 'F'); // Fond blanc pour l'en-tête

    // Ajouter le logo
    try {
      this.doc.addImage(logoValdor, 'PNG', 14, 5, 40, 25); // Ajuster dimensions et position
    } catch (e) {
      console.error("Erreur lors de l'ajout du logo", e);
      // Fallback texte si le logo échoue
      this.doc.setFontSize(10);
      this.doc.text("VILLE DE VAL-D'OR", 14, 20);
    }

    this.doc.setTextColor(30, 58, 138); // Bleu foncé
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 200, 20, { align: 'right' });

    // Ligne de séparation
    this.doc.setDrawColor(30, 58, 138);
    this.doc.setLineWidth(0.5);
    this.doc.line(14, 35, 196, 35);

    this.doc.setFont('helvetica', 'normal');
  }

  private addContactInfo(request: PickupRequestPDF): void {
    let y = 45;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Informations de la demande', 14, y);
    y += 8;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const info = [
      { label: 'Numéro BC', value: request.bcNumber },
      { label: 'Demandeur', value: request.contactName },
      { label: 'Téléphone', value: request.contactPhone },
      { label: 'Date', value: new Date(request.date).toLocaleDateString('fr-CA') },
      { label: 'ID', value: request.id },
    ];

    info.forEach(item => {
      if (item.value) {
        this.doc.text(`${item.label}: ${item.value}`, 14, y);
        y += 5;
      }
    });

    if (request.notes && request.notes.trim()) {
      y += 3;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Notes générales:', 14, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      const splitNotes = this.doc.splitTextToSize(request.notes, 182);
      this.doc.text(splitNotes, 14, y);
    }
  }

  private addItemsTable(groupedItems: GroupedItemsByLocation): number {
    let y = (this.doc as any).lastAutoTable?.finalY || 90;

    Object.entries(groupedItems).forEach(([location, locationData], index) => {
      const items = Array.isArray(locationData) ? locationData : locationData.items;
      const comments = !Array.isArray(locationData) ? locationData.comments : null;

      if (items.length === 0) return;

      if (y > 250) {
        this.doc.addPage();
        y = 20;
      }

      y += 10;
      // Titre du lieu (sans emoji pour éviter les problèmes d'encodage)
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(14, y - 6, 182, 8, 'F');
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Lieu ${index + 1}: ${location}`, 16, y);
      y += 8;

      const addressInfo = LOCATION_ADDRESSES[location];
      if (addressInfo) {
        this.doc.setTextColor(80, 80, 80);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Adresse: ${addressInfo.fullAddress}`, 16, y);
        y += 6;
      }

      if (comments && comments.trim()) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`Instructions: ${comments}`, 16, y);
        y += 6;
      }

      const tableData: string[][] = items.map(item => [item.name, item.quantity.toString()]);

      autoTable(this.doc, {
        head: [['Contenant', 'Quantité']],
        body: tableData,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
        headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 142 },
          1: { halign: 'center', cellWidth: 40 }
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

    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(14, y, 196, y);
    y += 10;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Résumé', 14, y);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Total de contenants: ${request.totalItems}`, 14, y + 7);
    this.doc.text(`Nombre de lieux: ${request.totalLocations}`, 80, y + 7);
  }

  private addFooter(): void {
    const pageCount = (this.doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      (this.doc as any).setPage(i);
      const pageHeight = this.doc.internal.pageSize.height;
      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`Généré le ${new Date().toLocaleString('fr-CA')}`, 14, pageHeight - 10);
      this.doc.text(`Page ${i} / ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
  }

  generatePickupRequestPDF(request: PickupRequestPDF): void {
    this.addHeader('DEMANDE DE RAMASSAGE');
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
