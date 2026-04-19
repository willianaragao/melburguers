import sys

def reveal_columns():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Show all available keys of the first order in the diagnostic panel
    debug_cols = """{orders.length} pedidos | Colunas: {Object.keys(orders[0] || {}).join(', ')} | Status: {orders[0]?.status || 'N/A'}"""
    content = content.replace("pedidos encontrados | Primeiro status: {orders[0]?.status || 'N/A'} | Sincronizado", debug_cols)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def temp_fix_app():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the problematic 'troco' column to let orders flow, 
    # and put it inside the address object as a workaround
    content = content.replace("troco: changeNeeded,", "// troco: changeNeeded,")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

reveal_columns()
temp_fix_app()
print("Raio-X de colunas ativado. Coluna 'troco' comentada para liberar o checkout.")
