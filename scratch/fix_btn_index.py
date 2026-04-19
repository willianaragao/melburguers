import sys

file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line numbering in view_file starts at 1, so line 481 is index 480
target_idx = 480 
if "CONTINUAR PARA ENTREGA" in "".join(lines[target_idx-5:target_idx+5]):
    # Find the line that starts with '                      style={{ width: \'100%\', height: \'60px\''
    for i in range(target_idx-5, target_idx+5):
        if 'style={{ width: \'100%\', height: \'60px\', background: theme.primary' in lines[i]:
            lines[i] = "                      style={{ width: '100%', height: '62px', background: theme.textZinc, color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}\n"
            break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
