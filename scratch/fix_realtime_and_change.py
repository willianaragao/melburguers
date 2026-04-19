import sys

def fix_admin():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Improve Realtime listener to be more robust and include original_db_id
    old_realtime = """      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, (payload) => {
          const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
          setOrders(current => {
            if (current.some(o => o.id === newOrder.id)) return current;
            return [newOrder, ...current];
          });
        })
        .subscribe();"""
    
    new_realtime = """      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          table: 'pedidos',
          schema: 'public' 
        }, (payload) => {
          console.log("Novo pedido recebido via Realtime:", payload.new);
          const newOrder = { 
            ...payload.new, 
            id: payload.new.order_id || payload.new.id,
            original_db_id: payload.new.id // Garantir o ID interno para manipulação
          };
          setOrders(current => {
            // Verifica se o pedido já existe para não duplicar se o fetchOrders disparar junto
            const exists = current.some(o => (o.order_id === newOrder.order_id) || (o.id === newOrder.id));
            if (exists) return current;
            return [newOrder, ...current];
          });
        })
        .subscribe((status) => {
          console.log("Status da assinatura Realtime:", status);
        });"""
        
    if old_realtime in content:
        content = content.replace(old_realtime, new_realtime)
        
    # Improve Date Filtering
    old_today = """    if (dateFilter === 'today') {
      const orderDate = new Date(o.created_at || o.timestamp);
      const today = new Date();
      return orderDate.getDate() === today.getDate() && 
             orderDate.getMonth() === today.getMonth() && 
             orderDate.getFullYear() === today.getFullYear();
    }"""
    
    new_today = """    if (dateFilter === 'today') {
      const orderDate = new Date(o.created_at || o.timestamp);
      const today = new Date();
      // Verificação mais resiliente (ignora horas e compara datas puras)
      const isSameDay = orderDate.toLocaleDateString() === today.toLocaleDateString();
      return isSameDay;
    }"""

    content = content.replace(old_today, new_today)
    
    # Also fix the one in filteredOrders
    old_today_filter = """    const today = new Date();
    const isToday = orderDate.getDate() === today.getDate() && 
                    orderDate.getMonth() === today.getMonth() && 
                    orderDate.getFullYear() === today.getFullYear();"""
                    
    new_today_filter = """    const today = new Date();
    const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();"""
    
    content = content.replace(old_today_filter, new_today_filter)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_kanban():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\OrdersKanban.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the change needed check more robust (handle cases where it might be string/null/undefined)
    old_change = "if (order.status === 'concluido' || order.status === 'excluido') return null;" # Just a marker to find the file is correct
    
    # Actually, let's fix the OrderCard's change needed check
    old_alert = """      {/* Alerta de Troco */}
      {order.payment_method === 'Dinheiro' && order.change_needed && ("""
      
    new_alert = """      {/* Alerta de Troco */}
      {order.payment_method === 'Dinheiro' && (order.change_needed || order.troco) && ("""
      
    content = content.replace(old_alert, new_alert)
    content = content.replace("order.change_needed", " (order.change_needed || order.troco) ")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_admin()
fix_kanban()
print("Sincronização e visualização de troco atualizadas com sucesso.")
