import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, ArrowDownRight, Bell, Printer,
  X, Plus, PieChart as PieIcon, ListFilter,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Ultra-Premium Color Palette & Theme Config
const theme = {
  bgApp: '#050506',
  bgSurface: '#0B0B0F',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#F4F4F5',
  textMuted: '#A1A1AA',
  textFaint: '#71717A',
  greenSober: '#10B981', // Emerald
  redSober: '#EF4444',
  blueSober: '#3B82F6',
  buttonGhostBg: 'rgba(255, 255, 255, 0.03)',
  buttonGhostHover: 'rgba(255, 255, 255, 0.08)',
  catColors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#64748b']
};

export const FinanceDashboard = ({ 
  orders = [], 
  transactions = [], 
  categories = [], 
  onAddTransaction, 
  onAddCategory,
  playNotificationSound,
  handlePrinterConnect,
  isPrinterReady
}) => {
  const [activeTab, setActiveTab] = useState('entradas');
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', categoryId: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: theme.catColors[0] });
  const [hoveredRow, setHoveredRow] = useState(null);

  // Math Utils
  const totalOrders = useMemo(() => orders.reduce((acc, o) => acc + (o.total || 0), 0), [orders]);
  const totalManualIncome = useMemo(() => transactions.filter(t => t.type === 'entry').reduce((acc, t) => acc + (t.amount || 0), 0), [transactions]);
  const totalIn = totalOrders + totalManualIncome;
  const totalOut = useMemo(() => transactions.filter(t => t.type === 'exit').reduce((acc, t) => acc + (t.amount || 0), 0), [transactions]);
  const netProfit = totalIn - totalOut;

  // Chart Data
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.type === 'exit' && t.category_id === cat.id).reduce((acc, t) => acc + (t.amount || 0), 0),
      color: cat.color
    })).filter(d => d.value > 0);
  }, [categories, transactions]);

  // Consolidated Cash Flow
  const cashFlow = useMemo(() => {
    const arr = [
      ...orders.map(o => ({
        id: `ord-${o.id}`,
        type: 'entry',
        desc: `Pedido #${o.id} - ${o.address?.customerName?.split(' ')[0] || 'Cliente'}`,
        amount: o.total,
        date: new Date(o.created_at || o.timestamp),
        category: 'App Delivery',
        color: theme.greenSober,
      })),
      ...transactions.map(t => {
        const cat = categories.find(c => c.id === t.category_id);
        return {
          id: `txn-${t.id || Math.random()}`,
          type: t.type,
          desc: t.description,
          amount: t.amount,
          date: new Date(t.created_at || new Date()),
          category: cat ? cat.name : (t.type === 'entry' ? 'Receita Manual' : 'Geral'),
          color: cat ? cat.color : (t.type === 'entry' ? theme.greenSober : theme.textFaint),
        };
      })
    ];
    return arr.sort((a, b) => b.date - a.date);
  }, [orders, transactions, categories]);

  const handleAdd = (type) => {
    if (!newTransaction.description || !newTransaction.amount) return;
    onAddTransaction({ ...newTransaction, type, categoryId: newTransaction.categoryId || undefined });
    setNewTransaction({ description: '', amount: '', categoryId: '' });
  };

  const handleCreateCategory = () => {
    if(newCategory.name) { 
      onAddCategory(newCategory); 
      setShowCategoryModal(false); 
      setNewCategory({name:'', color: theme.catColors[0]}); 
    }
  };

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '40px', background: 'transparent' }}>
      
      {/* 1. HEADER FINANCEIRO PREMIUM SILENCIOSO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', color: theme.textPrimary }}>
            Inteligência Financeira
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.greenSober }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted }}>Sincronizado</span>
            </div>
            <span style={{ fontSize: '12px', color: theme.textFaint }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted }}>
              Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={playNotificationSound} style={{ 
            background: 'transparent', border: `1px solid ${theme.borderLight}`, padding: '0 20px', height: '40px',
            borderRadius: '8px', color: theme.textMuted, fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
          }} onMouseEnter={e => {e.currentTarget.style.background = theme.buttonGhostHover; e.currentTarget.style.color = theme.textPrimary;}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted;}}>
            <Bell size={14} /> Som
          </button>
          <button onClick={handlePrinterConnect} style={{ 
             background: 'transparent', border: `1px solid ${theme.borderLight}`, padding: '0 20px', height: '40px',
             borderRadius: '8px', color: isPrinterReady ? theme.greenSober : theme.textMuted, fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
          }} onMouseEnter={e => {e.currentTarget.style.background = theme.buttonGhostHover; e.currentTarget.style.color = isPrinterReady ? theme.greenSober : theme.textPrimary;}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isPrinterReady ? theme.greenSober : theme.textMuted;}}>
            <Printer size={14} /> {isPrinterReady ? 'Impressora OK' : 'Impressora'}
          </button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO (FLAT PREMIUM) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Lucro */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted, letterSpacing: '1px' }}>LUCRO LÍQUIDO</span>
            <DollarSign size={18} color={theme.textFaint} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: 500, color: theme.textPrimary, letterSpacing: '-1px' }}>R$ {netProfit.toFixed(2).replace('.', ',')}</span>
        </motion.div>

        {/* Entradas */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted, letterSpacing: '1px' }}>TOTAL DE ENTRADAS</span>
            <ArrowUpRight size={18} color={theme.greenSober} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: 500, color: theme.greenSober, letterSpacing: '-1px' }}>R$ {totalIn.toFixed(2).replace('.', ',')}</span>
        </motion.div>

        {/* Saídas */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme.textMuted, letterSpacing: '1px' }}>TOTAL DE SAÍDAS</span>
            <ArrowDownRight size={18} color={theme.redSober} style={{ opacity: 0.8 }} />
          </div>
          <span style={{ fontSize: '32px', fontWeight: 500, color: theme.redSober, letterSpacing: '-1px' }}>R$ {totalOut.toFixed(2).replace('.', ',')}</span>
        </motion.div>
      </div>

      {/* Grid Intermediário */}
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.8fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* 3. BLOCO DE CONTROLE (Entradas/Saídas) */}
        <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '12px' }}>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.borderLight}`, borderRadius: '12px' }}>
            {[
              { id: 'entradas', icon: ArrowUpRight },
              { id: 'saidas', icon: ArrowDownRight },
              { id: 'pedidos', icon: ListFilter }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  flex: 1, padding: '12px', background: activeTab === tab.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', borderRadius: '8px', color: activeTab === tab.id ? theme.textPrimary : theme.textMuted, 
                  fontWeight: 500, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                <span style={{ textTransform: 'capitalize' }}>{tab.id}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '0 12px 12px 12px' }}>
            <AnimatePresence mode="popLayout">
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                
                {activeTab !== 'pedidos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 2, minWidth: '200px' }}>
                        <input 
                          style={{ width: '100%', height: '52px', background: theme.bgApp, border: `1px solid ${theme.borderLight}`, borderRadius: '10px', padding: '0 16px', color: theme.textPrimary, outline: 'none', fontSize: '14px', transition: 'border 0.2s' }}
                          placeholder="Descrição da movimentação" 
                          value={newTransaction.description}
                          onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                          onFocus={e => e.currentTarget.style.border = `1px solid ${theme.borderHover}`}
                          onBlur={e => e.currentTarget.style.border = `1px solid ${theme.borderLight}`}
                        />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <input 
                          type="number"
                          style={{ width: '100%', height: '52px', background: theme.bgApp, border: `1px solid ${theme.borderLight}`, borderRadius: '10px', padding: '0 16px', color: theme.textPrimary, fontWeight: 500, outline: 'none', fontSize: '14px', transition: 'border 0.2s' }}
                          placeholder="Valor (R$)" 
                          value={newTransaction.amount}
                          onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                          onFocus={e => e.currentTarget.style.border = `1px solid ${theme.borderHover}`}
                          onBlur={e => e.currentTarget.style.border = `1px solid ${theme.borderLight}`}
                        />
                      </div>

                      {activeTab === 'saidas' && (
                        <div style={{ flex: 1.5, minWidth: '150px' }}>
                          <select 
                            style={{ width: '100%', height: '52px', background: theme.bgApp, border: `1px solid ${theme.borderLight}`, borderRadius: '10px', padding: '0 16px', color: newTransaction.categoryId ? theme.textPrimary : theme.textMuted, outline: 'none', fontSize: '14px', cursor: 'pointer', appearance: 'none' }}
                            value={newTransaction.categoryId}
                            onChange={e => setNewTransaction({...newTransaction, categoryId: e.target.value})}
                          >
                            <option value="">Selecione categoria</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleAdd(activeTab === 'entradas' ? 'entry' : 'exit')}
                          style={{ 
                            padding: '0 32px', height: '44px', background: 'transparent',
                            color: activeTab === 'entradas' ? theme.greenSober : theme.redSober, 
                            border: `1px solid ${activeTab === 'entradas' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '8px', fontWeight: 500, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {e.currentTarget.style.background = activeTab === 'entradas' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';}}
                          onMouseLeave={e => {e.currentTarget.style.background = 'transparent';}}
                        >
                          Salvar Registro
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {transactions.filter(t => t.type === (activeTab === 'entradas' ? 'entry' : 'exit')).map((t, idx, arr) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${theme.borderLight}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 500, color: theme.textPrimary, fontSize: '14px' }}>{t.description}</span>
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>{categories.find(c => c.id === t.category_id)?.name || 'Sem categoria'}</span>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 500, color: theme.textPrimary }}>
                              {t.type === 'entry' ? '+' : '-'} R$ {parseFloat(t.amount || 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                      {transactions.filter(t => t.type === (activeTab === 'entradas' ? 'entry' : 'exit')).length === 0 && (
                        <span style={{ fontSize: '13px', color: theme.textFaint, textAlign: 'center', padding: '24px 0' }}>Sem lançamentos recentes.</span>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'pedidos' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', background: 'transparent', border: `1px solid ${theme.borderLight}`, borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <AlertCircle size={16} color={theme.textMuted} style={{ marginTop: '2px' }}/>
                      <span style={{ fontSize: '13px', color: theme.textMuted, lineHeight: '1.6' }}>Receitas geradas pelo aplicativo. Seus valores formam o fluxo de capital automático do sistema e não podem ser apagados pelo módulo financeiro.</span>
                    </div>
                    {orders.slice(0, 5).map((o, idx, arr) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${theme.borderLight}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: 500, color: theme.textPrimary, fontSize: '14px' }}>Pedido #{o.id} • {o.address?.customerName?.split(' ')[0] || 'Cliente local'}</span>
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>{new Date(o.created_at || o.timestamp).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 500, color: theme.textPrimary }}>+ R$ {(o.total || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <span style={{ fontSize: '13px', color: theme.textFaint, textAlign: 'center', padding: '24px 0' }}>Sem pedidos concluídos.</span>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 4 & 5. BLOCO DE CATEGORIAS & GRÁFICO (Refinado) */}
        <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: theme.textPrimary, margin: 0 }}>Análise de Gastos</h3>
            <button onClick={() => setShowCategoryModal(true)} style={{ background: 'transparent', border: `1px solid ${theme.borderLight}`, borderRadius: '8px', padding: '6px 12px', color: theme.textMuted, fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.color=theme.textPrimary; e.currentTarget.style.border=`1px solid ${theme.borderHover}`}} onMouseLeave={e=>{e.currentTarget.style.color=theme.textMuted; e.currentTarget.style.border=`1px solid ${theme.borderLight}`}}>
              Nova Categoria
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: '240px', marginBottom: '32px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '8px', padding: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: theme.textPrimary, fontWeight: 500, fontSize: '12px' }}
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    {/* Donut Chart Fino */}
                    <Pie data={chartData} innerRadius={85} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={index} fill={entry.color} style={{ outline: 'none', transition: 'all 0.2s' }} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.8, height: '200px', justifyContent: 'center', marginBottom: '32px' }}>
                <PieIcon size={32} color={theme.textFaint} strokeWidth={1} />
                <span style={{ fontSize: '12px', color: theme.textFaint, textAlign: 'center' }}>Não há dados de saída<br/>para desenhar a métrica.</span>
              </div>
            )}
          </div>

          {/* Listagem Ultraclean */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.length > 0 ? categories.map((cat, idx) => {
              const catTotal = transactions.filter(t => t.type === 'exit' && t.category_id === cat.id).reduce((acc, t) => acc + (t.amount || 0), 0);
              const percentage = totalOut > 0 ? Math.round((catTotal / totalOut) * 100) : 0;
              return (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: idx === 0 ? 'none' : `1px solid ${theme.borderLight}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: theme.textPrimary }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>{percentage}%</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: theme.textPrimary }}>R$ {catTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '13px', color: theme.textFaint }}>Categorias não geradas.</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. TABELA DE FLUXO DE CAIXA CONSOLIDADO */}
      <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderLight}`, borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: theme.textPrimary, margin: '0 0 32px 0' }}>Fluxo de Caixa Consolidado</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr>
                  <th style={{ padding: '0 0 16px 0', fontSize: '12px', color: theme.textFaint, fontWeight: 500, borderBottom: `1px solid ${theme.borderLight}` }}>Status</th>
                  <th style={{ padding: '0 0 16px 0', fontSize: '12px', color: theme.textFaint, fontWeight: 500, borderBottom: `1px solid ${theme.borderLight}` }}>Data</th>
                  <th style={{ padding: '0 0 16px 0', fontSize: '12px', color: theme.textFaint, fontWeight: 500, borderBottom: `1px solid ${theme.borderLight}` }}>Descrição</th>
                  <th style={{ padding: '0 0 16px 0', fontSize: '12px', color: theme.textFaint, fontWeight: 500, borderBottom: `1px solid ${theme.borderLight}` }}>Categoria</th>
                  <th style={{ padding: '0 0 16px 0', fontSize: '12px', color: theme.textFaint, fontWeight: 500, borderBottom: `1px solid ${theme.borderLight}`, textAlign: 'right' }}>Valor</th>
                </tr>
            </thead>
            <tbody>
                {cashFlow.map((item) => (
                  <tr 
                    key={item.id} 
                    style={{ transition: 'background 0.2s', background: hoveredRow === item.id ? 'rgba(255,255,255,0.02)' : 'transparent', cursor: 'default' }} 
                    onMouseEnter={() => setHoveredRow(item.id)} 
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                      <td style={{ padding: '16px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
                        <div style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, border: `1px solid ${theme.borderLight}`, color: item.type === 'entry' ? theme.textPrimary : theme.textMuted }}>
                            {item.type === 'entry' ? 'Entrada' : 'Saída'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
                        <span style={{ fontSize: '13px', color: theme.textMuted }}>{item.date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}</span>
                      </td>
                      <td style={{ padding: '16px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
                        <span style={{ fontSize: '13px', color: theme.textPrimary, fontWeight: 500 }}>{item.desc}</span>
                      </td>
                      <td style={{ padding: '16px 0', borderBottom: `1px solid ${theme.borderLight}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                          <span style={{ fontSize: '13px', color: theme.textMuted }}>{item.category}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 0', borderBottom: `1px solid ${theme.borderLight}`, textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', color: item.type === 'entry' ? theme.textPrimary : theme.textMuted, fontWeight: 500 }}>
                            {item.type === 'entry' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                  </tr>
                ))}
                {cashFlow.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: theme.textFaint, fontSize: '13px' }}>Sem dados no fluxo de caixa atual.</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CADASTRAR CATEGORIA (Refinado) */}
      <AnimatePresence>
        {showCategoryModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} transition={{ duration: 0.2 }} style={{ background: theme.bgSurface, padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: `1px solid ${theme.borderLight}`, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: theme.textPrimary, margin: 0 }}>Nova Categoria</h2>
                  <button onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: 'none', color: theme.textFaint, cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color=theme.textPrimary} onMouseLeave={e => e.currentTarget.style.color=theme.textFaint}>
                    <X size={18}/>
                  </button>
               </div>
               
               <div style={{ marginBottom: '24px' }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: theme.textMuted, marginBottom: '8px' }}>Nome da conta</label>
                 <input 
                    style={{ width: '100%', height: '48px', background: theme.bgApp, border: `1px solid ${theme.borderLight}`, borderRadius: '10px', padding: '0 16px', color: theme.textPrimary, outline: 'none', fontSize: '14px', transition: 'border 0.2s' }}
                    placeholder="Ex: Fornecedores" 
                    value={newCategory.name}
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                    onFocus={e => e.currentTarget.style.border=`1px solid ${theme.borderHover}`}
                    onBlur={e => e.currentTarget.style.border=`1px solid ${theme.borderLight}`}
                  />
               </div>

               <div style={{ marginBottom: '40px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: theme.textMuted, marginBottom: '12px' }}>Cor de Identificação</label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {theme.catColors.map(color => (
                        <button 
                          key={color}
                          onClick={() => setNewCategory({...newCategory, color})}
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', background: color, 
                            border: newCategory.color === color ? '2px solid white' : '2px solid transparent', 
                            cursor: 'pointer', transition: 'transform 0.1s', transform: newCategory.color === color ? 'scale(1.1)' : 'scale(1)',
                            opacity: newCategory.color === color ? 1 : 0.6
                          }}
                        />
                      ))}
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button 
                    onClick={() => setShowCategoryModal(false)}
                    style={{ padding: '0 24px', height: '44px', background: 'transparent', color: theme.textPrimary, borderRadius: '8px', fontWeight: 500, fontSize: '13px', border: `1px solid ${theme.borderLight}`, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background=theme.buttonGhostHover}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    Cancelar
                  </button>
                 <button 
                    onClick={handleCreateCategory}
                    style={{ padding: '0 24px', height: '44px', background: theme.textPrimary, color: theme.bgApp, borderRadius: '8px', fontWeight: 500, fontSize: '13px', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity=0.9}
                    onMouseLeave={e => e.currentTarget.style.opacity=1}
                  >
                    Criar
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
