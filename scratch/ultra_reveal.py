import sys

def ultra_reveal():
    path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Adicionar um modal de debug ultra visível
    debug_modal = """
        {/* MODAL DE AUDITORIA DE DADOS */}
        {orders.length > 0 && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, background: '#0f172a', padding: '20px', borderRadius: '15px', color: 'white', maxWidth: '300px', boxShadow: '0 0 40px rgba(0,0,0,0.5)', border: '2px solid #38bdf8' }}>
            <h3 style={{ fontSize: '12px', margin: '0 0 10px 0', color: '#38bdf8' }}>🔍 AUDITORIA DE COLUNAS</h3>
            <div style={{ fontSize: '11px', lineHeight: '1.6', wordBreak: 'break-all' }}>
              <strong>Colunas encontradas no seu banco:</strong><br/>
              {Object.keys(orders[0] || {}).map(k => (
                <span key={k} style={{ display: 'inline-block', background: '#1e293b', padding: '2px 6px', margin: '2px', borderRadius: '4px' }}>{k}</span>
              ))}
            </div>
            <button onClick={(e) => e.target.parentElement.style.display = 'none'} style={{ marginTop: '15px', width: '100%', padding: '5px', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Fechar Raio-X</button>
          </div>
        )}"""

    if "{/* MODAL DE AUDITORIA DE DADOS" not in content:
        # Colar no final do return
        content = content.replace("</div>\n    </div>\n  );", debug_modal + "\n    </div>\n    </div>\n  );")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

ultra_reveal()
print("Janela de Auditoria injetada no canto da tela.")
