import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PickupRequest } from '../types';
import logoValdor from '../src/assets/logo_valdor.png';

const getQRCode = async (text: string): Promise<string> => {
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
};

export const generatePdf = async (request: PickupRequest) => {
  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.width;

  // --- Header ---
  doc.setFillColor(30, 58, 138); // Navy Blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo
  try {
    doc.addImage(logoValdor, 'PNG', 14, 5, 45, 28);
  } catch (e) {
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("VILLE DE VAL-D'OR", 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Service de l'Environnement", 14, 26);
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMANDE DE CUEILLETTE', pageWidth - margin, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("DOCUMENT OFFICIEL", pageWidth - margin, 28, { align: 'right' });

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
    { label: "Statut:", value: request.status.toUpperCase() }
  ];

  details.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(detail.label, 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(detail.value), 150, y);
    y += 5;
  });

  // QR Code - Positioned with more spacing from text
  const qrCodeUrl = await getQRCode(request.id);
  if (qrCodeUrl) {
    doc.addImage(qrCodeUrl, 'PNG', 175, 50, 25, 25);
  }

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
