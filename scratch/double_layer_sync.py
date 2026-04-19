import sys

def fix_admin_final():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add a last sync timestamp state
    if "const [lastSync, setLastSync] = useState(new Date());" not in content:
        content = content.replace("const [orders, setOrders] = useState([]);", "const [orders, setOrders] = useState([]);\n  const [lastSync, setLastSync] = useState(new Date());")

    # Update fetchOrders to update lastSync
    content = content.replace("setOrders(combinedData);", "setOrders(combinedData);\n      setLastSync(new Date());")

    # Implementation of the "Double Layer" sync (Realtime + Polling)
    # We find the useEffect that handles subscriptions
    old_subscription_effect = """  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      syncMenuFromCloud();
      fetchFinanceData();

      // Realtime do Supabase
      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, () => {
          console.log("🔔 Novo pedido detectado! Sincronizando fila...");
          fetchOrders();
        })
        .subscribe();

      const channelExcluidos = supabase"""

    new_subscription_effect = """  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      syncMenuFromCloud();
      fetchFinanceData();

      // 1. CAMADA REALTIME (Eventos instantâneos)
      const channelPedidos = supabase
        .channel('db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
          console.log("⚡ Realtime: Alteração detectada!", payload.eventType);
          fetchOrders();
        })
        .subscribe();

      // 2. CAMADA DE BACKUP (Polling a cada 15 segundos)
      const pollingInterval = setInterval(() => {
        console.log("🕒 Sincronização de rotina...");
        fetchOrders();
      }, 15000);

      const channelExcluidos = supabase"""

    content = content.replace(old_subscription_effect, new_subscription_effect)
    
    # Fix the cleanup
    content = content.replace("supabase.removeChannel(channelPedidos);", "supabase.removeChannel(channelPedidos);\n        clearInterval(pollingInterval);")

    # Add Visual Indicator in the Header
    old_indicator = """<div style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                 <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Realtime</span>
              </div>"""
              
    new_indicator = """<div style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Sincronizado</span>
                 </div>
                 <span style={{ fontSize: '9px', color: '#71717a' }}>Atualizado às {lastSync.toLocaleTimeString()}</span>
              </div>"""
              
    content = content.replace(old_indicator, new_indicator)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_admin_final()
print("Sincronização de Dupla Camada (Realtime + Polling) instalada.")
