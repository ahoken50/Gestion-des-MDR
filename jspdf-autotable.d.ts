declare module 'jspdf-autotable' {
    import jsPDF from 'jspdf';

    export interface AutoTableOptions {
        head?: any[][];
        body?: any[][];
        startY?: number;
        theme?: 'striped' | 'grid' | 'plain';
        styles?: any;
        headStyles?: any;
        columnStyles?: any;
        margin?: any;
        alternateRowStyles?: any;
        showHead?: 'everyPage' | 'firstPage' | 'never';
        didDrawPage?: (data: any) => void;
        // Add other options as needed
    }

    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
