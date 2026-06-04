/**
 * Comprime uma imagem no cliente usando Canvas API
 * @param file O arquivo de imagem original
 * @param maxWidth Largura máxima (padrão 800px)
 * @param maxHeight Altura máxima (padrão 800px)
 * @param quality Qualidade JPEG de 0 a 1 (padrão 0.7)
 * @returns Promise com a string Base64 da imagem comprimida
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calcula novas dimensões mantendo o aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto do Canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Converte para Base64 comprimido
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
