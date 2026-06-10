/**
 * Comprime uma imagem no cliente usando Canvas API
 * @param file O arquivo de imagem original
 * @param maxWidth Largura máxima (padrão 800px)
 * @param maxHeight Altura máxima (padrão 800px)
 * @param quality Qualidade JPEG de 0 a 1 (padrão 0.7)
 * @param targetMaxBytes Tamanho alvo aproximado em bytes para a imagem final
 * @returns Promise com a string Base64 da imagem comprimida
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(blob)
  })
}

export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7,
  targetMaxBytes?: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
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

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto do Canvas"));
          return;
        }

        const drawImage = (nextWidth: number, nextHeight: number) => {
          canvas.width = Math.max(1, Math.round(nextWidth));
          canvas.height = Math.max(1, Math.round(nextHeight));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };

        drawImage(width, height);

        try {
          if (!targetMaxBytes) {
            resolve(canvas.toDataURL("image/jpeg", quality));
            return;
          }

          let currentWidth = width;
          let currentHeight = height;
          let currentQuality = quality;

          // Compression is adaptive: lower quality first, then slightly reduce dimensions.
          for (let attempt = 0; attempt < 7; attempt++) {
            const blob = await new Promise<Blob | null>((blobResolve) => {
              canvas.toBlob(blobResolve, "image/jpeg", currentQuality);
            });

            if (!blob) {
              reject(new Error("Não foi possível comprimir a imagem."));
              return;
            }

            if (blob.size <= targetMaxBytes || attempt === 6) {
              resolve(await blobToDataUrl(blob));
              return;
            }

            if (currentQuality > 0.45) {
              currentQuality = Math.max(0.45, currentQuality - 0.08);
            } else {
              currentWidth = Math.max(360, Math.round(currentWidth * 0.9));
              currentHeight = Math.max(360, Math.round(currentHeight * 0.9));
              drawImage(currentWidth, currentHeight);
            }
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
