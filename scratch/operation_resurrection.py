import sys

def ultimate_sync_fix():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Rebuild fetchOrders with individual safety nets
    robust_fetch = """  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    console.log("🔍 Iniciando busca de pedidos...");
    
    try {
      setDbError(null);
      
      // Busca isolada para evitar que erro em uma tabela trave tudo
      const { data: activeData, error: activeError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (activeError) {
        console.error("Erro na tabela pedidos:", activeError);
        setDbError("Erro na tabela pedidos: " + activeError.message);
      }

      const { data: deletedData, error: deletedError } = await supabase
        .from('pedidos_excluidos')
        .select('*')
        .order('created_at', { ascending: false });

      const combined = [
        ...(activeData || []),
        ...(deletedData || [])
      ].map(o => ({
        ...o,
        original_db_id: o.id,
        id: o.order_id || o.id
      }));

      setOrders(combined);
      setLastSync(new Date());
      console.log("✅ Busca concluída:", combined.length, "pedidos.");
    } catch (err) {
      console.error("CRITICAL SYNC ERROR:", err);
      setDbError("Erro crítico de sincronização.");
    }
  };"""

    # Replace the old fetchOrders (need to match carefully)
    # We find the start and find the end
    import re
    content = re.sub(r'const fetchOrders = async \(\) => \{.*?  \};', robust_fetch, content, flags=re.DOTALL)

    # 2. Use a Global Realtime Listener for the whole schema
    new_realtime = """      // 1. ESCUTA GLOBAL (Nuke Option - Qualquer mudança no schema public)
      const channel = supabase
        .channel('global-sync')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          console.log("⚡ MUDANÇA GLOBAL DETECTADA:", payload.table, payload.eventType);
          fetchOrders();
        })
        .subscribe();

      // 2. POLLING DE ALTA FREQUÊNCIA (7 segundos)
      const polling = setInterval(() => {
        fetchOrders();
      }, 7000);"""

    # Replace old realtime/polling block
    content = re.sub(r'// 1\. REALTIME.*?// 2\. POLLING.*?const polling = setInterval\(.*?10000\);', new_realtime, content, flags=re.DOTALL)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_app_sending():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make the insert more prominent
    content = content.replace("await supabase.from('pedidos').insert([", "console.log('📤 Enviando pedido...'); await supabase.from('pedidos').insert([")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

ultimate_sync_fix()
fix_app_sending()
print("Sincronização redundante e ultrarrápida ativada.")
