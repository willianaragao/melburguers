import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, ArrowDownRight, Bell, Printer,
  X, Plus, PieChart as PieIcon, ListFilter,
  AlertCircle, ChevronRight, Activity, Edit, Trash2, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// === PREMIUM SaaS THEME CONFIG ===
const theme = {
  bgApp: '#050506',         // Deep Black
  bgSurface: '#09090b',     // Elevated Surface
  bgInput: '#0d0d10',       // Darker Input
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderMuted: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#f8fafc',    // Soft White
  textMuted: '#94a3b8',      // Slate Muted
  textFaint: '#475569',      // Dark Slate
  
  // Sober Functional Colors
  greenSober: '#10b981',    // Emerald
  redSober: '#f43f5e',      // Rose
  blueSober: '#3b82f6',     // Blue
  
  // Interaction
  hoverBg: 'rgba(255, 255, 255, 0.03)',
  activeBg: 'rgba(255, 255, 255, 0.06)',
  
  // Chart Palette (Sober & Sophisticated)
  catColors: ['#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#64748b']
};

export const FinanceDashboard = ({ 
  orders = [], 
  transactions = [], 
  categories = [], 
  onAddTransaction, 
  onDeleteTransaction,
  onUpdateTransaction,
  onAddCategory,
  playNotificationSound,
  handlePrinterConnect,
  isPrinterReady
}) => {
  const [activeTab, setActiveTab] = useState('entradas');
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', categoryId: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpensesPanel, setShowExpensesPanel] = useState(false);
  const [showIncomesPanel, setShowIncomesPanel] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: theme.catColors[0] });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] = useState(false);

  // Math Utils
  const totalOrders = useMemo(() => orders.reduce((acc, o) => acc + (o.total || 0), 0), [orders]);
  const totalManualIncome = useMemo(() => transactions.filter(t => t.type === 'entry').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0), [transactions]);
  const totalIn = totalOrders + totalManualIncome;
  const totalOut = useMemo(() => transactions.filter(t => t.type === 'exit').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0), [transactions]);
  const netProfit = totalIn - totalOut;

  // Chart Data
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.type === 'exit' && t.category_id === cat.id).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0),
      color: cat.color
    })).filter(d => d.value > 0);
  }, [categories, transactions]);

  // Consolidated Cash Flow
  const cashFlow = useMemo(() => {
    const arr = [
      ...orders.map(o => ({
        id: `ord-${o.id}`,
        type: 'entry',
        desc: `Pedido #${o.id} • ${o.address?.customerName?.split(' ')[0] || 'Cliente'}`,
        amount: o.total,
        date: new Date(o.created_at || o.timestamp),
        category: 'App Delivery',
        color: theme.blueSober,
      })),
      ...transactions.map(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const amountNum = parseFloat(t.amount || 0);
        return {
          id: `txn-${t.id || Math.random()}`,
          type: t.type,
          desc: t.description,
          amount: amountNum,
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

  const handleSaveEdit = () => {
    if (editingExpense) {
      onUpdateTransaction(editingExpense.id, editingExpense);
      setEditingExpense(null);
    }
  };

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '32px', background: 'transparent', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 1. HEADER REFINADO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', color: theme.textPrimary }}>
            Inteligência Financeira
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: theme.greenSober, boxShadow: `0 0 10px ${theme.greenSober}` }} />
            <span style={{ fontSize: '11px', fontWeight: 500, color: theme.textMuted, letterSpacing: '0.2px' }}>
              Sincronizado • Atualizado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={playNotificationSound} style={{ 
            background: 'transparent', border: `1px solid ${theme.borderSubtle}`, padding: '0 12px', height: '34px',
            borderRadius: '6px', color: theme.textMuted, fontWeight: 500, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s'
          }} onMouseEnter={e => {e.currentTarget.style.background = theme.hoverBg; e.currentTarget.style.borderColor = theme.borderMuted;}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.borderSubtle;}}>
            <Bell size={13} /> Som
          </button>
          <button onClick={handlePrinterConnect} style={{ 
             background: 'transparent', border: `1px solid ${theme.borderSubtle}`, padding: '0 12px', height: '34px',
             borderRadius: '6px', color: isPrinterReady ? theme.greenSober : theme.textMuted, fontWeight: 500, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s'
          }} onMouseEnter={e => {e.currentTarget.style.background = theme.hoverBg; e.currentTarget.style.borderColor = theme.borderMuted;}} onMouseLeave={e => {e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.borderSubtle;}}>
            <Printer size={13} /> {isPrinterReady ? 'Impressora Pronta' : 'Impressora'}
          </button>
        </div>
      </header>

      {/* 2. CARDS DE RESUMO (SaaS STYLE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {[
          { label: 'LUCRO LÍQUIDO', value: netProfit, icon: DollarSign, color: theme.textPrimary, clickable: false },
          { label: 'TOTAL DE ENTRADAS', value: totalIn, icon: ArrowUpRight, color: theme.greenSober, clickable: true },
          { label: 'TOTAL DE SAÍDAS', value: totalOut, icon: ArrowDownRight, color: theme.redSober, clickable: true }
        ].map((card, i) => (
          <motion.div 
            key={i}
            onClick={card.clickable ? () => (card.label.includes('ENTRADAS') ? setShowIncomesPanel(true) : setShowExpensesPanel(true)) : undefined}
            whileHover={card.clickable ? { y: -4, borderColor: theme.borderMuted } : {}}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ 
              background: theme.bgSurface, 
              border: `1px solid ${theme.borderSubtle}`, 
              borderRadius: '12px', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: card.clickable ? 'pointer' : 'default'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, letterSpacing: '1px' }}>{card.label}</span>
              <card.icon size={16} color={card.color} style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: card.color, letterSpacing: '-0.5px' }}>
              R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            {card.clickable && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '9px', color: theme.textFaint, fontWeight: 700 }}>GERENCIAR →</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${card.color}44, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        
        {/* 3. BLOCO OPERACIONAL */}
        <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderSubtle}`, borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${theme.borderSubtle}` }}>
            <div style={{ display: 'inline-flex', gap: '24px', position: 'relative' }}>
              {[
                { id: 'entradas', label: 'Entradas', icon: ArrowUpRight },
                { id: 'saidas', label: 'Saídas', icon: ArrowDownRight },
                { id: 'pedidos', label: 'Pedidos App', icon: Activity }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    padding: '0 0 12px 0', 
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${theme.textPrimary}` : '2px solid transparent',
                    color: activeTab === tab.id ? theme.textPrimary : theme.textMuted, 
                    fontWeight: activeTab === tab.id ? 600 : 500, 
                    fontSize: '13px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ opacity: 1 }}>
                
                {activeTab !== 'pedidos' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    <div style={{ background: theme.bgInput, border: `1px solid ${theme.borderSubtle}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                          <input 
                            style={{ width: '100%', height: '44px', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.borderMuted}`, color: theme.textPrimary, outline: 'none', fontSize: '14px' }}
                            placeholder="Descrição da movimentação..." 
                            value={newTransaction.description}
                            onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="number"
                            style={{ width: '100%', height: '44px', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.borderMuted}`, color: theme.textPrimary, fontWeight: 500, outline: 'none', fontSize: '14px' }}
                            placeholder="Valor R$" 
                            value={newTransaction.amount}
                            onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                          />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <div 
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.borderMuted}`, color: newTransaction.categoryId ? theme.textPrimary : theme.textFaint, outline: 'none', fontSize: '13px', cursor: 'pointer', paddingRight: '4px' }}
                          >
                            <span>{categories.find(c => c.id === newTransaction.categoryId)?.name || 'Categorias'}</span>
                            <ChevronDown size={14} color={theme.textFaint} />
                          </div>
                          {isCategoryDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1200, background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, borderRadius: '12px', marginTop: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                              <div 
                                onClick={() => {
                                  setNewTransaction({...newTransaction, categoryId: ''});
                                  setIsCategoryDropdownOpen(false);
                                }}
                                style={{ padding: '12px 16px', fontSize: '13px', color: theme.textFaint, cursor: 'pointer', borderBottom: `1px solid ${theme.borderSubtle}`, background: theme.bgInput }}
                              >
                                Limpar Seleção
                              </div>
                              {categories.map(c => (
                                <div 
                                  key={c.id}
                                  onClick={() => {
                                    setNewTransaction({...newTransaction, categoryId: c.id});
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  style={{ padding: '12px 16px', fontSize: '13px', color: theme.textPrimary, cursor: 'pointer', transition: 'background 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = theme.hoverBg}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {c.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleAdd(activeTab === 'entradas' ? 'entry' : 'exit')}
                          style={{ 
                            padding: '0 24px', height: '38px', 
                            background: activeTab === 'entradas' ? theme.greenSober : theme.textPrimary, 
                            color: activeTab === 'entradas' ? 'white' : theme.bgApp, 
                            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          {activeTab === 'entradas' ? 'Lançar Receita' : 'Lançar Despesa'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {transactions.filter(t => t.type === (activeTab === 'entradas' ? 'entry' : 'exit')).length > 0 ? (
                        transactions.filter(t => t.type === (activeTab === 'entradas' ? 'entry' : 'exit')).map((t, idx, arr) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.bgInput, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {t.type === 'entry' ? <ArrowUpRight size={14} color={theme.greenSober} /> : <ArrowDownRight size={14} color={theme.redSober} />}
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500, color: theme.textPrimary, fontSize: '14px' }}>{t.description}</span>
                                  <span style={{ fontSize: '11px', color: theme.textMuted }}>{categories.find(c => c.id === t.category_id)?.name || (t.type === 'entry' ? 'Receita Manual' : 'Geral')}</span>
                               </div>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: t.type === 'entry' ? theme.greenSober : theme.textPrimary }}>
                                R$ {parseFloat(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.5 }}>
                           <ListFilter size={24} style={{ margin: '0 auto 12px' }} />
                           <p style={{ fontSize: '13px' }}>Sem movimentações registradas para esta aba.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', border: `1px solid rgba(59, 130, 246, 0.1)`, borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={14} color={theme.blueSober}/>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>Pedidos liquidados via App entram automaticamente no fluxo de caixa.</span>
                    </div>
                    {orders.slice(0, 10).map((o, idx, arr) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx === arr.length - 1 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.blueSober }} />
                             <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 500, color: theme.textPrimary, fontSize: '14px' }}>Pedido #{o.id} • {o.address?.customerName || 'Cliente'}</span>
                                <span style={{ fontSize: '11px', color: theme.textMuted }}>{new Date(o.created_at || o.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: theme.textPrimary }}>+ R$ {(o.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 4. BLOCO ANALÍTICO (RIGHT) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderSubtle}`, borderRadius: '16px', padding: '24px', flex: 1 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.5px' }}>ANÁLISE DE GASTOS</span>
                <button 
                  onClick={() => setShowCategoryModal(true)} 
                  style={{ background: 'transparent', border: `1px solid ${theme.borderSubtle}`, borderRadius: '6px', padding: '4px 10px', color: theme.textPrimary, fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                >
                  <Plus size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Categoria
                </button>
             </div>

             <div style={{ height: '200px', width: '100%', marginBottom: '32px', position: 'relative' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="99%" height="99%">
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, borderRadius: '8px', color: theme.textPrimary }}
                        itemStyle={{ color: theme.textPrimary }}
                      />
                      <Pie data={chartData} innerRadius={70} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                     <PieIcon size={40} strokeWidth={1} />
                     <span style={{ fontSize: '11px', marginTop: '10px' }}>Aguardando lançamentos</span>
                  </div>
                )}
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categories.map((cat) => {
                  const catTotal = transactions.filter(t => t.type === 'exit' && t.category_id === cat.id).reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
                  const perc = totalOut > 0 ? ((catTotal / totalOut) * 100).toFixed(0) : 0;
                  return (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
                         <span style={{ fontSize: '12px', color: theme.textPrimary, fontWeight: 500 }}>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted }}>{perc}%</span>
                        <span style={{ fontSize: '12px', color: theme.textPrimary, fontWeight: 600 }}>R$ {catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div style={{ background: `linear-gradient(135deg, ${theme.blueSober}22, transparent)`, border: `1px solid ${theme.blueSober}33`, borderRadius: '16px', padding: '24px' }}>
             <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: theme.textPrimary }}>Mel Burgers Insights</h4>
             <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, lineHeight: '1.5' }}>
                O lucro líquido atual de R$ {netProfit.toLocaleString('pt-BR')} representa uma margem de segurança baseada nos pedidos de hoje.
             </p>
          </div>
        </div>
      </div>

      {/* 5. FLUXO DE CAIXA CONSOLIDADO */}
      <div style={{ background: theme.bgSurface, border: `1px solid ${theme.borderSubtle}`, borderRadius: '16px', padding: '24px' }}>
         <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, letterSpacing: '0.5px' }}>FLUXO DE CAIXA CONSOLIDADO</span>
         </div>
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.borderSubtle}` }}>
                     <th style={{ padding: '0 0 12px 0', fontSize: '11px', color: theme.textFaint, fontWeight: 600 }}>CÓDIGO</th>
                     <th style={{ padding: '0 0 12px 0', fontSize: '11px', color: theme.textFaint, fontWeight: 600 }}>MOVIMENTAÇÃO</th>
                     <th style={{ padding: '0 0 12px 0', fontSize: '11px', color: theme.textFaint, fontWeight: 600 }}>CATEGORIA</th>
                     <th style={{ padding: '0 0 12px 0', fontSize: '11px', color: theme.textFaint, fontWeight: 600, textAlign: 'right' }}>VALOR BRUTO</th>
                  </tr>
               </thead>
               <tbody>
                  {cashFlow.map((item, idx) => (
                     <tr key={idx} style={{ borderBottom: idx === cashFlow.length - 1 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                        <td style={{ padding: '16px 0', fontSize: '12px', color: theme.textFaint }}>#{item.id.slice(-4)}</td>
                        <td style={{ padding: '16px 0', fontSize: '13px', color: theme.textPrimary, fontWeight: 500 }}>{item.desc}</td>
                        <td style={{ padding: '16px 0' }}>
                           <span style={{ padding: '3px 8px', background: theme.bgInput, borderRadius: '4px', fontSize: '10px', color: theme.textMuted, border: `1px solid ${theme.borderSubtle}` }}>
                              {item.category}
                           </span>
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: item.type === 'entry' ? theme.greenSober : theme.textPrimary }}>
                           {item.type === 'entry' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* DRAWER DE GESTÃO - UNIFICADO PARA ENTRADAS E SAÍDAS (BETTER UX) */}
      <AnimatePresence>
        {(showExpensesPanel || showIncomesPanel) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {setShowExpensesPanel(false); setShowIncomesPanel(false); setEditingExpense(null);}}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '450px', zIndex: 10000, background: theme.bgSurface, borderLeft: `1px solid ${theme.borderMuted}`, boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '32px', borderBottom: `1px solid ${theme.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: theme.textPrimary }}>{showIncomesPanel ? 'Gestão de Receitas' : 'Gestão de Despesas'}</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.textMuted }}>
                    {showIncomesPanel ? 'Gerencie as entradas manuais de caixa.' : 'Visualize, edite ou exclua registros de saída.'}
                  </p>
                </div>
                <button onClick={() => {setShowExpensesPanel(false); setShowIncomesPanel(false); setEditingExpense(null);}} style={{ background: theme.bgInput, border: 'none', padding: '8px', borderRadius: '8px', color: theme.textMuted, cursor: 'pointer' }}><X size={18}/></button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {transactions.filter(t => t.type === (showIncomesPanel ? 'entry' : 'exit')).map((t) => (
                    <div key={t.id} style={{ background: theme.bgInput, border: `1px solid ${theme.borderSubtle}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {editingExpense?.id === t.id ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input 
                              style={{ width: '100%', background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                              value={editingExpense.description}
                              onChange={e => setEditingExpense({...editingExpense, description: e.target.value})}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="number"
                                style={{ flex: 1, background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                                value={editingExpense.amount}
                                onChange={e => setEditingExpense({...editingExpense, amount: e.target.value})}
                              />
                                <div style={{ flex: 1, position: 'relative' }}>
                                  <div 
                                    onClick={() => setIsEditCategoryDropdownOpen(!isEditCategoryDropdownOpen)}
                                    style={{ width: '100%', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, color: 'white', padding: '0 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                                  >
                                    <span>{categories.find(c => c.id === editingExpense.category_id)?.name || 'Categorias'}</span>
                                    <ChevronDown size={14} color={theme.textFaint} />
                                  </div>
                                  {isEditCategoryDropdownOpen && (
                                    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 12100, background: theme.bgSurface, border: `1px solid ${theme.borderMuted}`, borderRadius: '12px', marginBottom: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                                      {categories.map(c => (
                                        <div 
                                          key={c.id}
                                          onClick={() => {
                                            setEditingExpense({...editingExpense, category_id: c.id});
                                            setIsEditCategoryDropdownOpen(false);
                                          }}
                                          style={{ padding: '10px 16px', fontSize: '13px', color: theme.textPrimary, cursor: 'pointer', transition: 'background 0.2s' }}
                                          onMouseEnter={e => e.currentTarget.style.background = theme.hoverBg}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                          {c.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                               <button onClick={handleSaveEdit} style={{ flex: 1, background: theme.textPrimary, color: theme.bgApp, border: 'none', height: '32px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                               <button onClick={() => setEditingExpense(null)} style={{ flex: 1, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.borderSubtle}`, height: '32px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                            </div>
                         </div>
                       ) : (
                         <>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: theme.textPrimary }}>{t.description}</div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{categories.find(c => c.id === t.category_id)?.name || (showIncomesPanel ? 'Venda Direta' : 'Geral')} • {new Date(t.created_at).toLocaleDateString()}</div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: showIncomesPanel ? theme.greenSober : theme.textPrimary }}>R$ {parseFloat(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: `1px solid ${theme.borderSubtle}`, paddingTop: '12px' }}>
                              <button onClick={() => setEditingExpense(t)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit size={12}/> Editar</button>
                              <button onClick={() => onDeleteTransaction(t.id)} style={{ background: 'transparent', border: 'none', color: theme.redSober, fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={12}/> Excluir</button>
                           </div>
                         </>
                       )}
                    </div>
                  ))}
                  {transactions.filter(t => t.type === (showIncomesPanel ? 'entry' : 'exit')).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textFaint }}>Não há registros manuais nesta categoria.</div>
                  )}
                  {showIncomesPanel && (
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', border: `1px solid rgba(59, 130, 246, 0.1)`, borderRadius: '10px', marginTop: '10px' }}>
                       <span style={{ fontSize: '11px', color: theme.textMuted }}>Nota: Pedidos vindos do App não aparecem aqui para edição, apenas lançamentos manuais.</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL CATEGORIA */}
      <AnimatePresence>
        {showCategoryModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: theme.bgSurface, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '380px', border: `1px solid ${theme.borderMuted}` }}>
               <h2 style={{ fontSize: '16px', color: theme.textPrimary, marginBottom: '24px' }}>Nova Categoria</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <input style={{ background: theme.bgInput, border: `1px solid ${theme.borderMuted}`, color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }} placeholder="Nome da Categoria..." value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                     {theme.catColors.map(c => (
                        <button key={c} onClick={() => setNewCategory({...newCategory, color: c})} style={{ width: '28px', height: '28px', borderRadius: '6px', background: c, border: newCategory.color === c ? '2px solid white' : 'none', cursor: 'pointer' }} />
                     ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                     <button onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: theme.textMuted, border: 'none', cursor: 'pointer' }}>Fechar</button>
                     <button onClick={handleCreateCategory} style={{ flex: 1, padding: '10px', background: theme.textPrimary, color: theme.bgApp, border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Criar</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
