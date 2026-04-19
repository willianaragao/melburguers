import sys

def fix_admin_robust():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change Realtime logic to be more robust by fetching orders on any insert
    # This avoids local array manipulation bugs and ensures proper sorting/fields
    old_realtime_complex = """      const channelPedidos = supabase
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
    
    new_realtime_robust = """      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, () => {
          console.log("🔔 Novo pedido detectado! Sincronizando fila...");
          fetchOrders();
        })
        .subscribe();"""
        
    if old_realtime_complex in content:
        content = content.replace(old_realtime_complex, new_realtime_robust)
    else:
        # Fallback if the previous fix was slightly different
        content = content.replace(".on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, (payload) => {", ".on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, () => { fetchOrders(); ")

    # Disable strict date filtering for pending orders - they must ALWAYS show
    old_filtered_orders = """    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.timestamp);
      const today = new Date();
      const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();
      
      // Se estiver na aba de Concluídos, só mostra concluídos
      if (statusFilter === 'concluded') return order.status === 'concluido';
      
      // Se estiver na aba de Excluídos, só mostra excluídos
      if (statusFilter === 'deleted') return order.status === 'excluido';

      // Se NÃO estiver na aba de Excluídos, esconde apenas excluídos (concluídos aparecem na Fila Geral agora)
      if (order.status === 'excluido') return false;

      // Filtros adicionais de Data e Status
      if (dateFilter === 'today' && !isToday) return false;"""

    new_filtered_orders = """    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.timestamp);
      const today = new Date();
      const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();
      
      // Se estiver na aba de Concluídos, só mostra concluídos
      if (statusFilter === 'concluded') return order.status === 'concluido';
      
      // Se estiver na aba de Excluídos, só mostra excluídos
      if (statusFilter === 'deleted') return order.status === 'excluido';

      // Se NÃO estiver na aba de Excluídos, esconde apenas excluídos
      if (order.status === 'excluido') return false;

      // EXCEÇÃO: Pedidos pendentes ou em preparo DEVEM SEMPRE aparecer, independente da data
      // Isso evita que pedidos feitos perto da meia-noite sumam da fila
      const isUrgentStatus = ['pendente', 'pago', 'preparo', 'pronto', 'entrega'].includes(order.status);
      if (isUrgentStatus) return true;

      // Filtros adicionais de Data e Status para concluídos
      if (dateFilter === 'today' && !isToday) return false;"""
      
    content = content.replace(old_filtered_orders, new_filtered_orders)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_admin_robust()
print("Sistema de Fila Geral e Realtime robustecido.")
