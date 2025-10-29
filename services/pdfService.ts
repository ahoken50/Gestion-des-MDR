import type { PickupRequest } from '../types';

// Let TypeScript know that jsPDF is available on the window object
declare const jsPDF: any;

export const generatePdf = (request: PickupRequest) => {
  // Use the global jsPDF constructor provided by the script tag
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Demande de Cueillette', 14, 22);
  doc.setFontSize(12);
  doc.text(`ID de la demande: ${request.id}`, 14, 32);
  doc.text(`Date: ${new Date(request.date).toLocaleDateString('fr-CA')}`, 14, 38);
  
  doc.text(`Lieu de cueillette: ${request.location}`, 14, 50);
  doc.text(`Contact: ${request.contactName} (${request.contactPhone})`, 14, 56);
  
  if (request.notes) {
    doc.text('Notes:', 14, 68);
    const splitNotes = doc.splitTextToSize(request.notes, 180);
    doc.text(splitNotes, 14, 74);
  }

  const tableColumn = ["Contenant", "Quantité"];
  const tableRows: (string | number)[][] = [];

  request.items.forEach(item => {
    const itemData = [
      item.name,
      item.quantity,
    ];
    tableRows.push(itemData);
  });
  
  // The autoTable plugin attaches itself to the jsPDF instance when loaded globally.
  // We cast to 'any' to bypass TypeScript checks since we are not importing the types.
  (doc as any).autoTable({
    startY: request.notes ? 85 : 70,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] }
  });
  
  doc.save(`demande_cueillette_${request.id}.pdf`);
};