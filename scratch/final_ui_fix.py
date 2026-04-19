file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    if i < skip_until:
        continue
    
    # Identify the start of the buggy payment section
    if "Selecione o Pagamento" in line and "</span></div>" in line:
        # Keep the header part but clean it up
        new_lines.append("                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7', marginBottom: '20px' }}>\n")
        new_lines.append("                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>\n")
        new_lines.append("                           <ShoppingCart size={18} color={theme.primary} />\n")
        new_lines.append("                           <span style={{ fontSize: '14px', fontWeight: 700 }}>Selecione o Pagamento</span>\n")
        new_lines.append("                        </div>\n")
        
        # Now find the buttons block
        # We find the next buttons block and skip everything until the end of the buggy section
        j = i + 1
        found_buttons = False
        while j < len(lines):
            if "['PIX', 'Cartão', 'Dinheiro'].map" in lines[j]:
                new_lines.append("                        <div style={{ display: 'flex', gap: '8px' }}>\n")
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
                found_buttons = True
                
                # Now skip until AnimatePresence
                k = j + 1
                while k < len(lines) and "AnimatePresence" not in lines[k]:
                    k += 1
                skip_until = k
                break
            j += 1
        continue
    
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
