declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: any): void;
  }

  class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'mm' | 'pt' | 'in' | 'px';
      format?: 'a4' | 'letter' | string;
    });

    addPage(): void;
    text(text: string | string[], x: number, y: number, options?: any): void;
    setFontSize(size: number): void;
    setFont(font: string, style?: string): void;
    setTextColor(r: number, g: number, b: number): void;
    setFillColor(r: number, g: number, b: number): void;
    rect(x: number, y: number, width: number, height: number, style?: 'F' | 'D' | 'FD'): void;
    roundedRect(x: number, y: number, width: number, height: number, rx: number, ry: number, style?: 'F' | 'D' | 'FD'): void;
    splitTextToSize(text: string, width: number): string[];
    internal: {
      pageSize: {
        width: number;
        height: number;
      };
    };
    save(filename: string): void;
    output(type: string): Blob | string;
    getNumberOfPages(): number;
    setPage(page: number): void;
  }

  export default jsPDF;
}

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  export default function autoTable(doc: jsPDF, options: any): void;
}