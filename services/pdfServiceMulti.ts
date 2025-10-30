import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GroupedItemsByLocation, PickupRequestPDF, PDFGenerationOptions } from '../types-pdf';

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
    // En-tête avec bordure
    this.doc.setFillColor(59, 130, 246); // Bleu
    this.doc.rect(0, 0, 210, 40, 'F');
    
    // Titre
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 105, 25, { align: 'center' });
    
    // Réinitialiser les styles
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
  }

  private addContactInfo(request: PickupRequestPDF): void {
    const startY = 50;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informations de demande', 20, startY);
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    if (request.bcNumber) {
      this.doc.text(`Numéro BC: ${request.bcNumber}`, 20, startY + 10);
      this.doc.text(`Nom: ${request.contactName}`, 20, startY + 20);
      this.doc.text(`Téléphone: ${request.contactPhone}`, 20, startY + 30);
    } else {
      this.doc.text(`Nom: ${request.contactName}`, 20, startY + 10);
      this.doc.text(`Téléphone: ${request.contactPhone}`, 20, startY + 20);
    }
    this.doc.text(`Date: ${new Date(request.date).toLocaleDateString('fr-CA')}`, 20, startY + 30);
    this.doc.text(`ID de demande: ${request.id}`, 20, startY + 40);
    
    // Notes si présentes
    if (request.notes && request.notes.trim()) {
      this.doc.text('Notes:', 20, startY + 55);
      const splitNotes = this.doc.splitTextToSize(request.notes, 170);
      this.doc.text(splitNotes, 20, startY + 65);
    }
  }

  private addItemsTable(groupedItems: GroupedItemsByLocation): number {
    let currentY = 120;
    
    // Préparer les données pour le tableau avec regroupement
    const tableData: string[][] = [];
    
    Object.entries(groupedItems).forEach(([location, locationData]) => {
      // Support des deux formats: array direct ou objet avec items/comments
      const items = Array.isArray(locationData) ? locationData : locationData.items;
      const comments = !Array.isArray(locationData) ? locationData.comments : null;
      
      // Ajouter les commentaires s'ils existent
      if (comments && comments.trim()) {
        tableData.push([
          location,
          `Commentaires: ${comments}`,
          ''
        ]);
      }
      
      items.forEach((item, index) => {
        tableData.push([
          index === 0 && !comments ? location : '', // Afficher le lieu seulement sur la première ligne si pas de commentaires
          item.name,
          item.quantity.toString()
        ]);
      });
    });
    
    // Tableau des contenants
    autoTable(this.doc, {
      head: [['Lieu', 'Contenant', 'Quantité']],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }, // Lieu en gras
        2: { halign: 'center' }   // Quantité centrée
      },
      didParseCell: (data) => {
        // Fusionner visuellement les cellules de localisation
        if (data.column.index === 0 && data.cell.raw && data.cell.raw !== '') {
          const location = data.cell.raw as string;
          const items = groupedItems[location];
          if (items && items.length > 1) {
            data.cell.styles.fillColor = [245, 245, 245];
          }
        }
      }
    });
    
    // Retourner la position Y après le tableau
    return (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addSummary(request: PickupRequestPDF, lastY: number): void {
    const startY = Math.max(lastY, 220);
    
    // Cadre récapitulatif
    this.doc.setFillColor(240, 240, 240);
    this.doc.roundedRect(20, startY, 170, 30, 3, 3, 'F');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Résumé', 30, startY + 15);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.text(`Total de contenants: ${request.totalItems}`, 30, startY + 25);
    this.doc.text(`Nombre de lieux: ${request.totalLocations}`, 120, startY + 25);
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;
    
    // Pied de page
    this.doc.setFontSize(8);
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(
      `Document généré le ${new Date().toLocaleString('fr-CA')}`,
      105,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  generatePickupRequestPDF(request: PickupRequestPDF): void {
    // En-tête
    this.addHeader('DEMANDE DE RAMASSAGE DE CONTENANTS');
    
    // Informations de contact
    this.addContactInfo(request);
    
    // Tableau des contenants
    const lastTableY = this.addItemsTable(request.groupedItems);
    
    // Résumé
    this.addSummary(request, lastTableY);
    
    // Pied de page
    this.addFooter();
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }

  getDataURL(): string {
    return this.doc.output('datauristring');
  }
}

// Fonction utilitaire pour regrouper les items par localisation
export function groupItemsByLocation(selectedItems: Array<{
  id: string;
  name: string;
  quantity: number;
  location: string;
}>): GroupedItemsByLocation {
  return selectedItems.reduce((groups, item) => {
    if (!groups[item.location]) {
      groups[item.location] = {
        items: [],
        comments: undefined
      };
    }
    groups[item.location].items.push(item);
    return groups;
  }, {} as GroupedItemsByLocation);
}

// Fonction utilitaire pour créer une demande PDF
export function createPickupRequestPDF(
  selectedItems: Array<{
    id: string;
    name: string;
    quantity: number;
    location: string;
  }>,
  contactInfo: {
    name: string;
    phone: string;
    notes?: string;
    bcNumber?: string;
  },
  groupedItemsWithComments?: Record<string, { items: any[], comments?: string }>
): PickupRequestPDF {
  const groupedItems = groupedItemsWithComments || groupItemsByLocation(selectedItems);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    id: `REQ-${Date.now()}`,
    bcNumber: contactInfo.bcNumber,
    date: new Date().toISOString(),
    contactName: contactInfo.name,
    contactPhone: contactInfo.phone,
    notes: contactInfo.notes,
    groupedItems,
    totalItems,
    totalLocations: Object.keys(groupedItems).length
  };
}