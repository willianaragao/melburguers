import sys

def inject_diagnostics():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add error state to show in UI
    if "const [dbError, setDbError] = useState(null);" not in content:
        content = content.replace("const [orders, setOrders] = useState([]);", "const [orders, setOrders] = useState([]);\n  const [dbError, setDbError] = useState(null);")

    # Update fetchOrders to catch and set error
    old_fetch = """    try {
      const [pedidosRes, excluidosRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('pedidos_excluidos').select('*').order('created_at', { ascending: false })
      ]);

      if (pedidosRes.error) throw pedidosRes.error;"""
      
    new_fetch = """    try {
      setDbError(null);
      const [pedidosRes, excluidosRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('pedidos_excluidos').select('*').order('created_at', { ascending: false })
      ]);

      if (pedidosRes.error) {
        setDbError(pedidosRes.error.message);
        throw pedidosRes.error;
      }"""
    
    content = content.replace(old_fetch, new_fetch)

    # Add Diagnostic Panel in the UI (near the top of the main area)
    diag_panel = """        {/* PAINEL DE DIAGNÓSTICO (APARECE SE HOUVER ERRO OU PARA TESTE) */}
        {isAuthenticated && (
          <div style={{ margin: '0 0 20px 0', padding: '15px', background: dbError ? '#fef2f2' : '#f0f9ff', borderRadius: '12px', border: `1px solid ${dbError ? '#fee2e2' : '#e0f2fe'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: dbError ? '#991b1b' : '#075985' }}>
                {dbError ? '⚠️ ERRO DE CONEXÃO' : '✅ CONEXÃO ESTÁVEL'}
              </div>
              <div style={{ fontSize: '11px', color: dbError ? '#b91c1c' : '#0369a1', marginTop: '4px' }}>
                {dbError ? dbError : `Total de pedidos carregados: ${orders.length} | Última busca: ${lastSync.toLocaleTimeString()}`}
              </div>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ padding: '8px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              LIMPAR TUDO E REINICIAR
            </button>
          </div>
        )}"""

    # Insert after the Sidebar/Header logic
    if "{/* PAINEL DE DIAGNÓSTICO" not in content:
        content = content.replace("const isMobile = window.innerWidth < 768;", "const isMobile = window.innerWidth < 768;") # Just a marker
        # Find where the main content starts
        if "<main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>" in content:
            content = content.replace("<main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>", "<main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>\n" + diag_panel)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

inject_diagnostics()
print("Painel de Diagnóstico injetado para rastrear falha de comunicação.")
