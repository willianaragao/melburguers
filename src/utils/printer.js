
export const formatOrderForPrinter = (cart, total, address) => {
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
    text += `${address.street}, ${address.number}\n`;
    text += `Bairro: ${address.neighborhood}\n`;
    if (address.complement) text += `Ref: ${address.complement}\n`;
    text += "--------------------------------\n";
  }

  text += "\x1B\x61\x00"; // Left align
  cart.forEach((item) => {
    const priceStr = `R$ ${item.price.toFixed(2).replace('.', ',')}`;
    text += `${item.name}\n`;
    text += `                   ${priceStr}\n`;
  });
  
  text += "--------------------------------\n";
  text += "\x1B\x61\x02"; // Right align
  text += `TOTAL: R$ ${total.toFixed(2).replace('.', ',')}\n`;
  text += "\x1B\x61\x01"; // Center align
  text += "\nObrigado pela preferência!\n";
  text += "Documento sem valor fiscal\n";
  text += "\n\n\n\n\x1D\x56\x00"; // Paper cut
  
  return new TextEncoder().encode(text);
};

export const printOrder = async (orderData) => {
  try {
    console.log("Requesting Bluetooth Device...");
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { namePrefix: 'TP' }, // Common for Thermal Printers
        { namePrefix: 'MTP' },
        { namePrefix: 'Inner' },
        { namePrefix: 'Blue' }
      ],
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    });

    console.log("Connecting to GATT Server...");
    const server = await device.gatt.connect();

    console.log("Getting Service...");
    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

    console.log("Getting Characteristic...");
    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    console.log("Writing Data...");
    // Split data into chunks if it's too large for MTU
    const chunkSize = 20;
    for (let i = 0; i < orderData.length; i += chunkSize) {
      await characteristic.writeValue(orderData.slice(i, i + chunkSize));
    }

    console.log("Print Complete!");
    return true;
  } catch (error) {
    console.error("Bluetooth Error:", error);
    // If user canceled or service not found, we still want to continue to WhatsApp
    return false;
  }
};
