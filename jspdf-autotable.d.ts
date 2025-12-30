declare module 'jspdf-autotable' {
    import jsPDF from 'jspdf';

    export interface Styles {
        font?: string;
        fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
        overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
        fillColor?: number | number[] | string;
        textColor?: number | number[] | string;
        halign?: 'left' | 'center' | 'right' | 'justify';
        valign?: 'top' | 'middle' | 'bottom';
        fontSize?: number;
        cellPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
        lineColor?: number | number[] | string;
        lineWidth?: number;
        cellWidth?: 'auto' | 'wrap' | number;
        minCellHeight?: number;
        minCellWidth?: number;
        // Observed usage in codebase
        borderBottomWidth?: number;
        borderBottomColor?: number | number[] | string;
    }

    export interface ColumnStyles {
        [key: string]: Partial<Styles>;
        [key: number]: Partial<Styles>;
    }

    export interface AutoTableOptions {
        head?: any[][];
        body?: any[][];
        foot?: any[][];
        startY?: number | false;
        theme?: 'striped' | 'grid' | 'plain';
        styles?: Partial<Styles>;
        headStyles?: Partial<Styles>;
        bodyStyles?: Partial<Styles>;
        footStyles?: Partial<Styles>;
        alternateRowStyles?: Partial<Styles>;
        columnStyles?: ColumnStyles;
        margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
        showHead?: 'everyPage' | 'firstPage' | 'never';
        showFoot?: 'everyPage' | 'lastPage' | 'never';
        didDrawPage?: (data: any) => void;
        didParseCell?: (data: any) => void;
        willDrawCell?: (data: any) => void;
        didDrawCell?: (data: any) => void;
        tableWidth?: 'auto' | 'wrap' | number;
        tableLineWidth?: number;
        tableLineColor?: number | number[] | string;
        html?: string | HTMLTableElement;
    }

    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
