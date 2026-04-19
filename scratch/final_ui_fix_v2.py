import sys

file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_buggy_section = False

for line in lines:
    if "checkoutStep === 'payment' && (" in line:
        new_lines.append(line)
        new_lines.append("                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>\n")
        new_lines.append("                    \n")
        new_lines.append("                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7' }}>\n")
        new_lines.append("                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>\n")
        new_lines.append("                           <ShoppingCart size={18} color={theme.primary} />\n")
        new_lines.append("                           <span style={{ fontSize: '14px', fontWeight: 700 }}>Selecione o Pagamento</span>\n")
        new_lines.append("                        </div>\n")
        new_lines.append("                        <div style={{ display: 'flex', gap: '10px' }}>\n")
        new_lines.append("                           {['PIX', 'Cartão', 'Dinheiro'].map(method => (\n")
        new_lines.append("                             <button\n")
        new_lines.append("                               key={method}\n")
        new_lines.append("                               onClick={() => setPaymentMethod(method)}\n")
        new_lines.append("                               style={{\n")
        new_lines.append("                                 flex: 1, padding: '16px 5px', borderRadius: '16px', fontSize: '13px', fontWeight: 900,\n")
        new_lines.append("                                 border: `2px solid ${paymentMethod === method ? theme.primary : '#e2e2e7'}`,\n")
        new_lines.append("                                 background: paymentMethod === method ? 'white' : 'transparent',\n")
        new_lines.append("                                 color: paymentMethod === method ? theme.primary : theme.textMuted,\n")
        new_lines.append("                                 transition: 'all 0.2s', cursor: 'pointer'\n")
        new_lines.append("                               }}\n")
        new_lines.append("                             >\n")
        new_lines.append("                               {method}\n")
        new_lines.append("                             </button>\n")
        new_lines.append("                           ))}\n")
        new_lines.append("                        </div>\n")
        new_lines.append("                    </div>\n")
        in_buggy_section = True
        continue
    
    if in_buggy_section:
        if "<AnimatePresence mode=\"wait\">" in line or "<AnimatePresence mode='wait'>" in line:
            in_buggy_section = False
            new_lines.append(line)
        continue
        
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
