declare module 'mupdf' {
  export interface Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  }

  export namespace Matrix {
    function scale(x: number, y: number): Matrix;
    function identity(): Matrix;
  }

  export interface ColorSpace {}

  export namespace ColorSpace {
    const DeviceRGB: ColorSpace;
    const DeviceGray: ColorSpace;
    const DeviceCMYK: ColorSpace;
  }

  export interface Pixmap {
    asPNG(): Buffer;
    asJPEG(quality?: number): Buffer;
    width: number;
    height: number;
  }

  export interface Page {
    toPixmap(matrix: Matrix, colorspace: ColorSpace, alpha: boolean, showAnnots: boolean): Pixmap;
  }

  export interface Document {
    countPages(): number;
    loadPage(index: number): Page;
  }

  export namespace Document {
    function openDocument(data: Buffer | ArrayBuffer | Uint8Array, magic?: string): Document;
  }
}
