import sys

file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Target any button background: theme.primary and replace with theme.textZinc
    if "background: theme.primary" in line and ("CONTINUAR PARA ENTREGA" in line or "IR PARA PAGAMENTO" in line or "FINALIZAR E ENVIAR WHATSAPP" in line or "setCheckoutStep" in line or "handleCheckout" in line):
        # We need to be careful with the context. 
        # But specifically looking for the primary buttons styles.
        updated_line = line.replace("background: theme.primary", "background: theme.textZinc")
        updated_line = updated_line.replace(f"boxShadow: `${{theme.primary}}33 0 10px 20px`", "boxShadow: '0 10px 20px rgba(0,0,0,0.1)'")
        updated_line = updated_line.replace(f"boxShadow: `0 10px 20px ${{theme.primary}}33`", "boxShadow: '0 10px 20px rgba(0,0,0,0.1)'")
        new_lines.append(updated_line)
    elif "background: theme.primary" in line and "handleCheckout" in lines[lines.index(line)+1]: # Handle case where text is on next line
        updated_line = line.replace("background: theme.primary", "background: theme.textZinc")
        new_lines.append(updated_line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
