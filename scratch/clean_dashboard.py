import sys

def clean_up_dashboard():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove Diagnostic Panel
    import re
    content = re.sub(r'\{/\* PAINEL DE DIAGNÓSTICO ULTRA-VISÍVEL \*/\}(.*?)\</div>\s+</div>', '', content, flags=re.DOTALL)
    
    # 2. Remove Audit Modal
    content = re.sub(r'\{/\* MODAL DE AUDITORIA DE DADOS \*/\}(.*?)</div>\s+</div>', '', content, flags=re.DOTALL)

    # 3. Final cleaning of any leftover debug text
    content = content.replace("`$ {orders.length} pedidos | Colunas: ${Object.keys(orders[0] || {}).join(', ')} | Status: ${orders[0]?.status || 'N/A'}`", "`${orders.length} pedidos encontrados • Sincronizado`")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

clean_up_dashboard()
print("Painel limpo e design premium restaurado.")
