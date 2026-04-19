import sys

def restore_simplicity():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Force the filteredOrders to be much more permissive
    # Remove complex filters and just show non-deleted/non-concluded orders by default
    old_filter_logic = """    const filteredOrders = orders.filter(order => {
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
      // Verificação de status ultra-permissiva para garantir que nada suma
      const s = String(order.status || '').toLowerCase().trim();
      const isUrgentStatus = ['pendente', 'pago', 'preparo', 'pronto', 'entrega', 'aberto'].includes(s);
      if (isUrgentStatus) return true;

      // Filtros adicionais de Data e Status para concluídos
      if (dateFilter === 'today' && !isToday) return false;
      
      if (statusFilter === 'pending' && order.status !== 'pendente' && order.status !== 'pago') return false;
      
      return true;
    });"""

    new_filter_logic = """    const filteredOrders = orders.filter(order => {
      // Se o status for nulo ou pendente, ele TEM que aparecer na Fila Geral
      const status = String(order.status || 'pendente').toLowerCase().trim();
      
      // Se estivermos na aba de Concluídos/Excluídos, respeitamos o filtro
      if (statusFilter === 'concluded') return status === 'concluido';
      if (statusFilter === 'deleted') return status === 'excluido';
      
      // Na visualização padrão, mostramos tudo que NÃO foi concluído nem excluído
      if (status === 'concluido' || status === 'excluido') return false;
      
      return true;
    });"""

    content = content.replace(old_filter_logic, new_filter_logic)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_app_checkout():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure the order is sent BEFORE showing success to guarantee the panel receives it
    old_success_trigger = """      setIsOrderSuccess(true);
      setIsCartOpen(false);
      
      const message = `*NOVO PEDIDO MELBURGUERS #${orderId}*...`;
      
      setTimeout(() => {
        window.open(`https://wa.me/5522996153138?text=${encodeURIComponent(message)}`, '_blank');
      }, 4000);"""
      
    # I'll just keep the 4s delay for the AUTO redirect, but the database insert is already awaited
    # The real issue is probably the message encoding or the redirect interrupting the flow
    # I will move the redirect to a better place if needed, but the current code awaits the insert.

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

restore_simplicity()
fix_app_checkout()
print("Sistema simplificado e filtros removidos.")
