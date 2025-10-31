import type { PickupRequest } from '../types';

// Let TypeScript know that jsPDF is available on the window object
declare const jsPDF: any;

export const generatePdf = (request: PickupRequest) => {
  // Use the global jsPDF constructor provided by the script tag
  const doc = new jsPDF();
  
  const primaryColor = [30, 58, 138]; // Bleu foncé (dark blue)
  const secondaryColor = [219, 234, 254]; // Bleu très clair (very light blue)
  let y = 15;
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- En-tête ---
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FICHE DE DEMANDE DE CUEILLETTE', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100); // Gris
  doc.text(`Demande N°: ${request.requestNumber || request.id.substring(0, 8)}`, margin, y);
  doc.text(`Date de la demande: ${new Date(request.date).toLocaleDateString('fr-CA')}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // --- Section Informations de Contact ---
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORMATIONS DE CONTACT', margin + 2, y + 6);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Noir
  doc.text(`Nom du contact: ${request.contactName}`, margin, y);
  y += 7;
  doc.text(`Téléphone: ${request.contactPhone}`, margin, y);
  y += 7;
  doc.text(`Lieu de cueillette: ${request.location}`, margin, y);
  y += 10;

  // --- Section Détails des Articles ---
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DÉTAILS DES ARTICLES', margin + 2, y + 6);
  y += 10;

  const tableColumn = ["Contenant", "Quantité"];
  const tableRows: (string | number)[][] = [];

  request.items.forEach(item => {
    tableRows.push([item.name, item.quantity]);
  });
  
  // Utilisation de autoTable pour le tableau des articles
  (doc as any).autoTable({
    startY: y,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12
    },
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      // Pied de page
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-CA')} à ${new Date().toLocaleTimeString('fr-CA')}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  // Mettre à jour la position Y après le tableau
  y = (doc as any).autoTable.previous.finalY + 5;

  // --- Section Notes ---
  if (request.notes) {
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('NOTES SUPPLÉMENTAIRES', margin + 2, y + 6);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const splitNotes = doc.splitTextToSize(request.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5; // Estimer la hauteur du texte
  }

  // --- Section Statut et Suivi (Optionnel) ---
  y += 5;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('STATUT ET SUIVI', margin + 2, y + 6);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Statut actuel: ${request.status.toUpperCase()}`, margin, y);
  y += 7;
  if (request.emails && request.emails.length > 0) {
    doc.text(`Courriels de suivi: ${request.emails.join(', ')}`, margin, y);
    y += 7;
  }

  doc.save(`demande_cueillette_${request.requestNumber || request.id.substring(0, 8)}.pdf`);
};
