import sys

def open_the_gates():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update the Diagnostic Panel to show the status of the first order for debugging
    debug_info = """${orders.length} pedidos encontrados | Primeiro status: {orders[0]?.status || 'N/A'} | Sincronizado"""
    content = content.replace("${orders.length} pedidos encontrados • Sincronizado", debug_info)

    # 2. Make the status check CASE-INSENSITIVE and more inclusive in filteredOrders
    old_urgent = """      const isUrgentStatus = ['pendente', 'pago', 'preparo', 'pronto', 'entrega'].includes(order.status);
      if (isUrgentStatus) return true;"""
      
    new_urgent = """      // Verificação de status ultra-permissiva para garantir que nada suma
      const s = String(order.status || '').toLowerCase().trim();
      const isUrgentStatus = ['pendente', 'pago', 'preparo', 'pronto', 'entrega', 'aberto'].includes(s);
      if (isUrgentStatus) return true;"""
      
    content = content.replace(old_urgent, new_urgent)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_kanban_logic():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\OrdersKanban.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the Kanban column filtering case-insensitive and more robust
    old_filter = """            const columnOrders = localOrders.filter(o => {
               // Compatibilidade com status antigos
               if (column.id === 'pendente') return o.status === 'pendente' || o.status === 'pago';
               return o.status === column.id;
            });"""
            
    new_filter = """            const columnOrders = localOrders.filter(o => {
               const s = String(o.status || '').toLowerCase().trim();
               const colId = column.id.toLowerCase();
               
               // Fila Geral aceita pendente, pago ou vazio
               if (colId === 'pendente') return s === 'pendente' || s === 'pago' || s === '';
               
               return s === colId;
            });"""
            
    content = content.replace(old_filter, new_filter)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

open_the_gates()
fix_kanban_logic()
print("Comportas abertas. Status normalizados para Fila Geral.")
