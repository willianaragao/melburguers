const getLogoData = async () => {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Largura múltipla de 8 para alinhamento perfeito (16 bytes)
        const width = 128; 
        const height = Math.floor(img.height * (width / img.width));
        
        canvas.width = width;
        canvas.height = height;
        
        // Fundo branco explícito para evitar problemas com transparência
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        const xL = (width / 8) % 256;
        const xH = Math.floor((width / 8) / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);
        
        // GS v 0 (Raster image)
        const header = new Uint8Array([0x1D, 0x76, 0x30, 0, xL, xH, yL, yH]);
        const bitmap = new Uint8Array(header.length + (width / 8) * height);
        bitmap.set(header);
        
        let offset = header.length;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x += 8) {
            let byte = 0;
            for (let b = 0; b < 8; b++) {
              const idx = ((y * width) + (x + b)) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const bl = pixels[idx + 2];
              const a = pixels[idx + 3];

              // Se o pixel for muito transparente, tratamos como branco (0)
              if (a < 50) {
                // Branco (bit 0)
              } else {
                // Cálculo de luminância para preto e branco
                const brightness = (r * 0.299 + g * 0.587 + bl * 0.114);
                if (brightness < 160) { // Threshold um pouco mais alto para garantir logo nítida
                  byte |= (1 << (7 - b)); // Preto (bit 1)
                }
              }
            }
            bitmap[offset++] = byte;
          }
        }
        resolve(bitmap);
      };
      img.onerror = () => resolve(null);
      // Tentamos o caminho absoluto da logo principal
      img.src = '/logo impressao termica.png';
    });
  } catch (e) {
    console.error("Erro logo:", e);
    return null;
  }
};

export const formatOrderForPrinter = async (cart, total, address, paymentMethod, deliveryFee = 0, subtotal = 0, via = "") => {
  console.log("[Mel Burguers] Formatando pedido - v2.2 (Com Logo)");
  
  // 📸 Obtém os dados binários da logo
  const logoData = await getLogoData();
  
  const encoder = new TextEncoder();
  let mainText = "";
  
  // Alinhamento central para o cabeçalho
  mainText += "\x1B\x61\x01";
  
  if (via) {
    mainText += `*** VIA ${via.toUpperCase()} ***\n`;
  }

  mainText += "\x1B\x21\x30"; // Double height and width
  mainText += "MEL BURGERS\n";
  mainText += "\x1B\x21\x00"; // Normal size
  mainText += "V2.2-BLUEFY-STABLE\n";
  const nowStr = new Date().toLocaleString('pt-BR');
  mainText += `${nowStr}\n`;
  mainText += "Sabor que conquista!\n";
  mainText += "--------------------------------\n";
  
  if (address) {
    mainText += "\x1B\x61\x01";
    mainText += "DADOS PARA ENTREGA\n";
    mainText += "\x1B\x61\x00";
    mainText += `${address.customerName || 'Cliente'}\n`;
    if (address.street) mainText += `${address.street}, ${address.number || ''}\n`;
    if (address.neighborhood) mainText += `Bairro: ${address.neighborhood}\n`;
    if (address.complement) mainText += `Ref: ${address.complement}\n`;
    mainText += "--------------------------------\n";
  }

  const parsePrice = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = val.toString().replace('R$', '').replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  mainText += "\x1B\x61\x00"; // Left align
  
  const groupedItems = [];
  const cartArr = Array.isArray(cart) ? cart : [];
  cartArr.forEach((item) => {
    const existing = groupedItems.find(i => i.name === item.name);
    const qty = Number(item.quantity) || 1;
    if (existing) {
      existing.quantity += qty;
    } else {
      groupedItems.push({ ...item, quantity: qty });
    }
  });

  groupedItems.forEach((item) => {
    const itemPrice = parsePrice(item.price);
    const itemTotal = itemPrice * item.quantity;
    const qtyName = `${item.quantity}x ${item.name}`;
    const priceStr = `R$ ${itemTotal.toFixed(2).replace('.', ',')}`;
    
    if (qtyName.length + priceStr.length < 31) {
      const spaces = 32 - qtyName.length - priceStr.length;
      mainText += `${qtyName}${" ".repeat(spaces)}${priceStr}\n`;
    } else {
      mainText += `${qtyName}\n`;
      const spaces = 32 - priceStr.length;
      mainText += `${" ".repeat(spaces)}${priceStr}\n`;
    }
  });
  
  mainText += "--------------------------------\n";
  mainText += "\x1B\x61\x02"; // Right align
  
  const safeSubtotal = subtotal || (total - (deliveryFee || 0));
  
  const formatRight = (label, value) => {
    const valStr = `R$ ${value.toFixed(2).replace('.', ',')}`;
    const spaces = 32 - label.length - valStr.length;
    return `${label}${" ".repeat(Math.max(1, spaces))}${valStr}\n`;
  };

  if (safeSubtotal > 0) {
    mainText += formatRight("SUBTOTAL:", safeSubtotal);
  }
  
  if (deliveryFee > 0) {
    mainText += formatRight("FRETE:", deliveryFee);
  }

  mainText += "\x1B\x21\x01"; // Bold
  mainText += formatRight("TOTAL:", total);
  mainText += "\x1B\x21\x00"; // Normal size
  
  if (paymentMethod) {
    mainText += "\x1B\x61\x00"; // Left
    mainText += `PAGTO: ${paymentMethod}\n`;
  }

  mainText += "\x1B\x61\x01"; // Center
  mainText += "\nObrigado pela preferencia!\n";
  mainText += "Documento sem valor fiscal\n";
  
  if (via === "OPERADOR") {
    mainText += "--------------------------------\n";
    mainText += "RECIBO DO ESTABELECIMENTO\n";
  }

  mainText += "\n\n\n\n\x1D\x56\x00"; // Cut (GS V 0)

  // Combina todos os buffers
  const init = new Uint8Array([0x1B, 0x40]);
  const mainTextData = encoder.encode(mainText);
  
  const totalLength = init.length + (logoData ? logoData.length : 0) + mainTextData.length;
  const combined = new Uint8Array(totalLength);
  
  let pos = 0;
  combined.set(init, pos); pos += init.length;
  if (logoData) {
    combined.set(logoData, pos); pos += logoData.length;
  }
  combined.set(mainTextData, pos);
  
  return combined;
};


export const connectToPrinter = async () => {
  try {
    console.log("[Mel Burguers] Procurando impressora Bluetooth...");

    const device = await navigator.bluetooth.requestDevice({
      // Filtra por nome (MPT-II) e também pelo UUID do serviço como fallback
      filters: [
        { namePrefix: 'MPT' },   // ✅ MPT-II — nome correto
        { namePrefix: 'MTP' },   // fallback (typo antigo, mantido por segurança)
        { namePrefix: 'TP' },
        { namePrefix: 'Inner' },
        { namePrefix: 'Blue' },
        { namePrefix: 'RP' },
        { namePrefix: 'Mini' },  // ✅ "Mini Printer" — nome da etiqueta
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    console.log("[Mel Burguers] Dispositivo selecionado:", device.name);

    // Listener para detectar desconexão automática
    device.addEventListener('gattserverdisconnected', () => {
      console.warn("[Mel Burguers] Impressora desconectada!");
    });

    console.log("[Mel Burguers] Conectando ao servidor GATT...");
    const server = await device.gatt.connect();

    console.log("[Mel Burguers] Obtendo serviço principal...");
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

    console.log("[Mel Burguers] Obtendo característica de escrita...");
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    console.log("[Mel Burguers] ✅ Impressora pronta para uso!");
    return { characteristic, device };

  } catch (error) {
    // Usuário cancelou o popup — não é um erro real
    if (error.name === 'NotFoundError' || error.message?.includes('cancelled')) {
      console.log("[Mel Burguers] Seleção de impressora cancelada pelo usuário.");
    } else {
      console.error("[Mel Burguers] Erro de conexão Bluetooth:", error);
    }
    return null;
  }
};


export const sendToPrinter = async (characteristic, orderData) => {
  try {
    console.log("[Mel Burguers] Enviando dados para a impressora...");

    // Chunk menor e delay maior para Bluefy (iOS) ser mais estável
    const chunkSize = 50;
    const chunkDelay = 60; // Mantido para estabilidade no Bluefy

    for (let i = 0; i < orderData.length; i += chunkSize) {
      const chunk = orderData.slice(i, i + chunkSize);

      if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }

      await new Promise(r => setTimeout(r, chunkDelay));
    }

    console.log("[Mel Burguers] ✅ Impressão concluída!");
    return true;

  } catch (error) {
    console.error("[Mel Burguers] Erro ao imprimir:", error);
    return false;
  }
};


// Função de alto nível: conecta e imprime em uma chamada
export const printOrder = async (orderData) => {
  const result = await connectToPrinter();
  if (result) {
    return await sendToPrinter(result.characteristic, orderData);
  }
  return false;
};
