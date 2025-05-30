
import jsPDF from 'jspdf';
import type { SelectedImage } from '@/app/page'; 

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;

const drawableWidth = A4_WIDTH_MM - 2 * MARGIN_MM;
const drawableHeight = A4_HEIGHT_MM - 2 * MARGIN_MM;

export const generatePdfFromImages = async (images: SelectedImage[], fileName: string): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < images.length; i++) {
    const imageFile = images[i].file; // Este é o objeto File real

    if (i > 0) {
      pdf.addPage();
    }

    const dimensionLoadingUrl = URL.createObjectURL(imageFile);
    let imageElement: HTMLImageElement;

    try {
      imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
          console.error(`Erro ao carregar imagem para dimensões: ${imageFile.name}. URL usada: ${dimensionLoadingUrl}`, err);
          reject(new Error(`Falha ao carregar imagem para dimensões: ${imageFile.name}`));
        };
        img.src = dimensionLoadingUrl;
      });
    } catch (dimensionError) {
        console.error(`Interrompendo geração de PDF para ${imageFile.name} devido a erro no carregamento de dimensões.`);
        URL.revokeObjectURL(dimensionLoadingUrl);
        throw dimensionError;
    } finally {
        URL.revokeObjectURL(dimensionLoadingUrl);
    }

    const imgWidth = imageElement.naturalWidth;
    const imgHeight = imageElement.naturalHeight;

    if (imgWidth === 0 || imgHeight === 0) {
        console.error(`Imagem ${imageFile.name} carregada com dimensões zero.`);
        throw new Error(`Imagem ${imageFile.name} carregada com dimensões zero. Não pode ser adicionada ao PDF.`);
    }

    const aspectRatio = imgWidth / imgHeight;

    let pdfImgWidth = drawableWidth;
    let pdfImgHeight = drawableWidth / aspectRatio;

    if (pdfImgHeight > drawableHeight) {
      pdfImgHeight = drawableHeight;
      pdfImgWidth = drawableHeight * aspectRatio;
    }
    
    const x = MARGIN_MM + (drawableWidth - pdfImgWidth) / 2;
    const y = MARGIN_MM + (drawableHeight - pdfImgHeight) / 2;
    
    const fileType = imageFile.type === 'image/png' ? 'PNG' : 'JPEG';
    
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    try {
        if (fileType === 'JPEG') {
            pdf.addImage(uint8Array, fileType, x, y, pdfImgWidth, pdfImgHeight, undefined, 'FAST');
        } else {
            pdf.addImage(uint8Array, fileType, x, y, pdfImgWidth, pdfImgHeight);
        }
    } catch (e) {
      console.warn(`Falha ao adicionar imagem '${imageFile.name}' usando Uint8Array. Tentando fallback com HTMLImageElement carregado. Erro: ${e instanceof Error ? e.message : String(e)}`);
      try {
        if (fileType === 'JPEG') {
            pdf.addImage(imageElement, fileType, x, y, pdfImgWidth, pdfImgHeight, undefined, 'FAST');
        } else {
            pdf.addImage(imageElement, fileType, x, y, pdfImgWidth, pdfImgHeight);
        }
      } catch (fallbackError) {
        console.error(`Método de fallback (HTMLImageElement) também falhou para '${imageFile.name}'. Erro: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
        throw new Error(`Falha ao adicionar imagem ${imageFile.name} ao PDF após múltiplas tentativas.`);
      }
    }
  }

  return pdf.output('blob');
};
