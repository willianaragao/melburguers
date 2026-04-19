import re
import sys

file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'Selecione o Pagamento' in line and '<h3' not in line:
        new_lines.append("                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7', marginBottom: '20px' }}>\n")
        new_lines.append("                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>\n")
        new_lines.append("                           <ShoppingCart size={18} color={theme.primary} />\n")
        new_lines.append("                           <span style={{ fontSize: '14px', fontWeight: 700 }}>Selecione o Pagamento</span>\n")
        new_lines.append("                        </div>\n")
        new_lines.append("                    </div>\n")
    elif '["PIX", "Cartão", "Dinheiro"]' in line or "['PIX', 'Cartão', 'Dinheiro']" in line:
        # Check if it's the payment button block
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
    elif "flex: 1, padding: '16px 10px', borderRadius: '18px', fontSize: '14px', fontWeight: 800," in line:
        continue # skip the old style lines
    elif "border: `2.2px solid ${paymentMethod === method ? theme.primary : '#f0f0f5'}`," in line:
        continue
    elif "background: paymentMethod === method ? theme.accent : 'white'," in line:
        continue
    elif "color: paymentMethod === method ? theme.primary : theme.textMuted," in line:
        continue
    elif "transition: 'all 0.2s'" in line and "cursor: 'pointer'" not in line and "fontWeight: 700" not in line:
         # This might be tricky, but we've already replaced the block above
         if "flex: 1, padding" in new_lines[-5]: continue
         new_lines.append(line)
    elif "<div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>" in line and "checkoutStep === 'payment'" in "".join(new_lines[-20:]):
        continue # skip the wrapper we're replacing
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
