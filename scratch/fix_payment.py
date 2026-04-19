import sys

file_path = r'c:\Users\Willian Aragão\Desktop\programas\melburguers\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """                     <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        {['PIX', 'Cartão', 'Dinheiro'].map(method => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            style={{
                              flex: 1, padding: '16px 10px', borderRadius: '18px', fontSize: '14px', fontWeight: 800,
                              border: `2.2px solid ${paymentMethod === method ? theme.primary : '#f0f0f5'}`,
                              background: paymentMethod === method ? theme.accent : 'white',
                              color: paymentMethod === method ? theme.primary : theme.textMuted,
                              transition: 'all 0.2s'
                            }}
                          >
                            {method}
                          </button>
                        ))}
                     </div>"""

new_block = """                        <div style={{ display: 'flex', gap: '8px' }}>
                           {['PIX', 'Cartão', 'Dinheiro'].map(method => (
                             <button
                               key={method}
                               onClick={() => setPaymentMethod(method)}
                               style={{
                                 flex: 1, padding: '16px 5px', borderRadius: '16px', fontSize: '13px', fontWeight: 900,
                                 border: `2px solid ${paymentMethod === method ? theme.primary : '#e2e2e7'}`,
                                 background: paymentMethod === method ? 'white' : 'transparent',
                                 color: paymentMethod === method ? theme.primary : theme.textMuted,
                                 transition: 'all 0.2s', cursor: 'pointer'
                               }}
                             >
                               {method}
                             </button>
                           ))}
                        </div>
                    </div>"""

if old_block in content:
    new_content = content.replace(old_block, new_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Sucesso!")
else:
    # Try with different indentation or just part of it
    print("Bloco não encontrado exatamente. Tentando versão parcial...")
    old_start = "                     <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>"
    if old_start in content:
        # We find where it starts and where the closing div ends
        idx = content.find(old_start)
        end_idx = content.find("                     </div>", idx) + len("                     </div>")
        new_content = content[:idx] + new_block + content[end_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Sucesso via substituição parcial!")
    else:
        print("Erro: Bloco não encontrado.")
