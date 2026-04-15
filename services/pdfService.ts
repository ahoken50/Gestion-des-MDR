import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PickupRequest } from '../types';
import logo from '../src/assets/logo.png';

// QR Code function removed

export const generatePdf = async (request: PickupRequest) => {
  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.width;

  // --- Header ---
  doc.setFillColor(15, 23, 42); // Deep Slate (match dark mode)
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo with Circular Clipping for High-End Look
  try {
    const radius = 17.5;
    const x = 14;
    const y = 5;
    
    // Draw white background for the badge
    doc.setFillColor(255, 255, 255);
    doc.circle(x + radius, y + radius, radius, 'F');
    
    // Setup clipping path for circular logo
    doc.saveGraphicsState();
    doc.circle(x + radius, y + radius, radius, 'f');
    doc.clip();
    doc.addImage(logo, 'PNG', x, y, 35, 35);
    doc.restoreGraphicsState();
    
    // Add a elegant gold border around the logo badge
    doc.setDrawColor(234, 179, 8); // amber-500 / Gold
    doc.setLineWidth(0.8);
    doc.circle(x + radius, y + radius, radius, 'D');
  } catch (e) {
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("VILLE DE VAL-D'OR", 55, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Service de l'Environnement", 55, 28);
  }

  // Header Accent Line (Gold)
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(1.5);
  doc.line(0, 44, pageWidth, 44);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMANDE DE CUEILLETTE', pageWidth - margin, 24, { align: 'right' }); // Vertical align

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("DOCUMENT OFFICIEL", pageWidth - margin, 32, { align: 'right' });

  let y = 50;

  // --- Contact Info (Invoice Style) ---
  // Left Column: Requester
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text("DEMANDEUR (CONTACT)", margin, y);

  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(request.contactName, margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(request.contactPhone, margin, y);
  y += 5;
  doc.text(request.location, margin, y);

  // Right Column: Details & QR
  y = 50;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text("DETAILS", 120, y);

  y += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const reqNum = (request as any).requestNumber || request.id.substring(0, 8);

  const details = [
    { label: "Date:", value: new Date(request.date).toLocaleDateString('fr-CA') },
    { label: "ID:", value: reqNum },
    { label: "LIEU DE RAMASSAGE:", value: request.location.toUpperCase(), isBold: true },
    { label: "Statut:", value: request.status.toUpperCase() }
  ];

  if (request.bcNumber) {
    const cleanBC = request.bcNumber.replace(/BC/gi, '').replace(/-/g, '').trim();
    details.push({ label: "BC #:", value: cleanBC });
  }

  details.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(detail.label, 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(detail.value), 150, y);
    y += 5;
  });

  // QR Code removed as requested
  // const qrCodeUrl = await getQRCode(request.id);
  // if (qrCodeUrl) {
  //   doc.addImage(qrCodeUrl, 'PNG', 170, 78, 25, 25);
  // }

  // --- Items Table ---
  y = 85;

  const tableColumn = ["DESCRIPTION DU CONTENANT", "QUANTITÉ"];
  const tableRows: (string | number)[][] = request.items.map(item => [item.name, item.quantity]);

  autoTable(doc, {
    startY: y,
    head: [tableColumn],
    body: tableRows,
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
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { halign: 'center', cellWidth: 32, fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // --- Notes ---
  if (request.notes) {
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text("NOTES SUPPLEMENTAIRES:", margin + 4, y + 5);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'italic');
    doc.text(request.notes, margin + 4, y + 10);
  }

  // --- Footer ---
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Ville de Val-d'Or - Service de l'Environnement", margin, pageHeight - 10);
    doc.text(`Généré le ${new Date().toLocaleString('fr-CA')}`, margin, pageHeight - 6);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.save(`demande_cueillette_${reqNum}.pdf`);
};
