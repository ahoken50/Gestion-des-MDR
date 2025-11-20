declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'mm' | 'pt' | 'in' | 'px';
    format?: 'a4' | 'letter' | string;
  }

  class jsPDF {
    constructor(options?: jsPDFOptions);

    addPage(): void;
    text(text: string | string[], x: number, y: number, options?: any): void;
    setFontSize(size: number): void;
    setFont(font: string, style?: string): void;
    setTextColor(r: number, g: number, b: number): void;
    setFillColor(r: number, g: number, b: number): void;
    rect(x: number, y: number, width: number, height: number, style?: 'F' | 'D' | 'FD'): void;
    roundedRect(x: number, y: number, width: number, height: number, rx: number, ry: number, style?: 'F' | 'D' | 'FD'): void;
    splitTextToSize(text: string, width: number): string[];
    addImage(imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array, format: string, x: number, y: number, w: number, h: number, alias?: string, compression?: string, rotation?: number): void;
    setDrawColor(r: number, g: number, b: number): void;
    setLineWidth(width: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
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
    autoTable(options: any): void;
  }

  export default jsPDF;
}