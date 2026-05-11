
// ─────────────────────────────────────────────────────────────────
//  printer.js — Mel Burguers
//  Compatível com: MPT-II, Bluefy (iOS), Web Bluetooth API
// ─────────────────────────────────────────────────────────────────

// Delay helper para dar tempo ao buffer da impressora entre chunks
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatOrderForPrinter = (cart, total, address, paymentMethod, deliveryFee = 0, subtotal = 0) => {
  let text = "\x1B\x40"; // Initialize printer
  text += "\x1B\x61\x01"; // Center align
  text += "\x1B\x21\x30"; // Double height and width
  text += "MEL BURGERS\n";
  text += "\x1B\x21\x00"; // Normal size
  text += "Sabor que conquista!\n";
  text += "--------------------------------\n";
  
  if (address) {
    text += "\x1B\x61\x01";
    text += "DADOS PARA ENTREGA\n";
    text += "\x1B\x61\x00";
    text += `${address.customerName || 'Cliente'}\n`;
    if (address.street) text += `${address.street}, ${address.number || ''}\n`;
    if (address.neighborhood) text += `Bairro: ${address.neighborhood}\n`;
    if (address.complement) text += `Ref: ${address.complement}\n`;
    text += "--------------------------------\n";
  }

  const parsePrice = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove R$, espaços e troca vírgula por ponto
    const clean = val.toString().replace('R$', '').replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  text += "\x1B\x61\x00"; // Left align
  
  // Agrupar itens caso não tenham quantidade (vindo do Checkout Web)
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
    
    // Tenta colocar na mesma linha se couber (32 colunas)
    if (qtyName.length + priceStr.length < 31) {
      const spaces = 32 - qtyName.length - priceStr.length;
      text += `${qtyName}${" ".repeat(spaces)}${priceStr}\n`;
    } else {
      text += `${qtyName}\n`;
      const spaces = 32 - priceStr.length;
      text += `${" ".repeat(spaces)}${priceStr}\n`;
    }
  });
  
  text += "--------------------------------\n";
  text += "\x1B\x61\x02"; // Right align
  
  const safeSubtotal = subtotal || (total - (deliveryFee || 0));
  
  const formatRight = (label, value) => {
    const valStr = `R$ ${value.toFixed(2).replace('.', ',')}`;
    const spaces = 32 - label.length - valStr.length;
    return `${label}${" ".repeat(Math.max(1, spaces))}${valStr}\n`;
  };

  if (safeSubtotal > 0) {
    text += formatRight("SUBTOTAL:", safeSubtotal);
  }
  
  if (deliveryFee > 0) {
    text += formatRight("FRETE:", deliveryFee);
  }

  text += "\x1B\x21\x01"; // Select bold or just slightly bigger
  text += formatRight("TOTAL:", total);
  text += "\x1B\x21\x00"; // Normal
  
  if (paymentMethod) {
    text += "\x1B\x61\x00"; // Left align
    text += `PAGTO: ${paymentMethod}\n`;
  }

  text += "\x1B\x61\x01"; // Center align
  text += "\nObrigado pela preferencia!\n";
  text += "Documento sem valor fiscal\n";
  text += "\n\n\n\n\x1D\x56\x00"; // Paper cut
  
  return new TextEncoder().encode(text);
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

    // Chunk de 100 bytes: compatível com MPT-II e seguro para BLE
    const chunkSize = 100;

    for (let i = 0; i < orderData.length; i += chunkSize) {
      const chunk = orderData.slice(i, i + chunkSize);

      // Usa writeValueWithoutResponse para compatibilidade com Bluefy/iOS
      // Fallback para writeValue em navegadores mais antigos
      if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }

      // Pausa entre chunks para não saturar o buffer da MPT-II
      await delay(30);
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
