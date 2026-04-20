import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Printer, Clock, Trash2, MapPin, LayoutGrid, LayoutList, Rows3, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const MinimalistTimer = ({ createdAt }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30); // Atualiza a cada 30s
    return () => clearInterval(timer);
  }, []);

  const createdTime = new Date(createdAt);
  const elapsedMinutes = (now - createdTime) / 60000;
  const limit = 40;
  const isDelayed = elapsedMinutes >= limit;
  
  const displayMinutes = isDelayed 
    ? Math.floor(elapsedMinutes - limit) 
    : Math.floor(limit - elapsedMinutes);

  const color = isDelayed ? '#ef4444' : '#22c55e';
  const progress = isDelayed 
    ? (elapsedMinutes % limit) / limit 
    : (limit - elapsedMinutes) / limit;

  const size = 30;
  const stroke = 2.4;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress * circumference);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', fontSize: '8px', fontWeight: 900, color: color, textAlign: 'center', fontFamily: 'monospace' }}>
        {displayMinutes}m
      </div>
    </div>
  );
};

const DeleteButton = ({ order, updateStatus }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button 
      onPointerDown={(e) => e.stopPropagation()} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { 
        e.stopPropagation(); 
        if(window.confirm('Excluir este pedido?')) updateStatus(order.id, 'excluido'); 
      }}
      style={{ 
        background: isHovered ? 'rgba(239, 68, 68, 0.05)' : 'transparent', 
        border: '1px solid ' + (isHovered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.06)'), 
        borderRadius: '6px', 
        padding: '6px', 
        cursor: 'pointer', 
        color: isHovered ? '#ef4444' : '#71717a', 
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Trash2 size={12} />
    </button>
  );
};

const ActionButton = ({ order, updateStatus }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (order.status === 'concluido' || order.status === 'excluido') return null;

  let btnText = '';
  let nextStatus = '';

  switch (order.status) {
    case 'pendente':
      btnText = 'Confirmar Pedido';
      nextStatus = 'preparo';
      break;
    case 'preparo':
      btnText = 'Pronto';
      nextStatus = 'pronto';
      break;
    case 'pronto':
      btnText = 'Colocar em rota';
      nextStatus = 'entrega';
      break;
    case 'entrega':
      btnText = 'Concluir';
      nextStatus = 'concluido';
      break;
    default: return null;
  }

  const isGreenHover = order.status === 'pendente';
  const hoverBg = isGreenHover ? '#22c55e' : 'rgba(255,255,255,0.08)';
  const hoverBorder = isGreenHover ? '#22c55e' : 'rgba(255,255,255,0.1)';

  return (
    <button 
      onPointerDown={(e) => e.stopPropagation()} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { 
        e.stopPropagation(); 
        updateStatus(order.id, nextStatus); 
      }}
      style={{ 
        width: '100%', 
        background: isHovered ? hoverBg : 'rgba(255,255,255,0.04)', 
        color: isHovered ? '#ffffff' : '#e2e8f0', 
        padding: '8px', 
        borderRadius: '8px', 
        fontSize: '11px', 
        border: '1px solid ' + (isHovered ? hoverBorder : 'rgba(255,255,255,0.04)'), 
        fontWeight: 600, 
        cursor: 'pointer', 
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10
      }}
    >
      {btnText}
    </button>
  );
};

// === DEFINIÇÃO DAS COLUNAS ===
const COLUMNS = [
  { id: 'pendente', title: 'Fila Geral', color: '#71717a' },
  { id: 'preparo', title: 'Em Preparo', color: '#b45309' },
  { id: 'pronto', title: 'Pronto', color: '#0369a1' },
  { id: 'entrega', title: 'Saiu p/ Entrega', color: '#6b21a8' },
  { id: 'concluido', title: 'Concluído', color: '#0f766e' }
];

// === COMPONENTE SORTABLE CARD ===
const SortableOrderCard = ({ order, handlePrint, updateStatus }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: order.id,
    data: { type: 'Order', order }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div 
      layout
      layoutId={`card-${order.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <OrderCard order={order} handlePrint={handlePrint} updateStatus={updateStatus} isDragging={isDragging} />
    </motion.div>
  );
};

// === MAPA DE CORES DE STATUS ===
const STATUS_COLORS = {
  pendente: '#71717a', // Cinza suave
  pago: '#71717a',     // Mesmo que pendente
  preparo: '#b45309',  // Laranja elegante
  pronto: '#0369a1',   // Azul sofisticado
  entrega: '#6b21a8',  // Roxo discreto
  concluido: '#0f766e', // Verde suave
  excluido: '#991b1b', // Vermelho fechado
};

// === COMPONENTE VISUAL DO CARD ===
const OrderCard = ({ order, handlePrint, updateStatus, isDragging, viewMode = 'list' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const clientPhone = order.address?.customerPhone?.replace(/\D/g, '');
  const waLink = clientPhone ? `https://wa.me/55${clientPhone}` : null;
  const statusColor = STATUS_COLORS[order.status] || '#71717a';
  const isGrid = viewMode === 'grid';
  
  const orderTime = new Date(order.created_at || order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getStatusLabel = (s) => {
    switch(s) {
      case 'pendente': return 'FILA GERAL';
      case 'preparo': return 'EM PREPARO';
      case 'pronto': return 'PRONTO';
      case 'entrega': return 'EM ROTA';
      case 'concluido': return 'CONCLUÍDO';
      default: return s?.toUpperCase();
    }
  };

  return (
    <div 
      onClick={() => isGrid && setIsExpanded(!isExpanded)}
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: isGrid ? '0' : '14px',
        boxShadow: isDragging ? '0 12px 48px rgba(0,0,0,0.7)' : '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      )}

      {/* Conteúdo Expansível (ou sempre visível no modo lista) */}
      <AnimatePresence>
        {(viewMode === 'list' || isExpanded) && (
          <motion.div
            initial={isCompact || isGrid ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden'}}
          >
            {isGrid && isExpanded && <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>{order.address?.customerName}</div>}

            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '10px', marginBottom: '12px', fontSize: isGrid ? '10px' : '11.5px', color: '#a1a1aa' }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>{item.quantity}x {item.name}</div>
              ))}
            </div>

            {order.address?.street && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <MapPin size={12} style={{ color: '#71717a', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '10.5px', color: '#f8fafc', lineHeight: '1.4' }}>
                  {order.address.street}, {order.address.number}
                </div>
              </div>
            )}

            {order.payment_method && (
              <div style={{ background: 'rgba(236, 148, 36, 0.05)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(236, 148, 36, 0.1)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <MessageSquare size={12} style={{ color: '#EC9424' }} />
                <div style={{ fontSize: '10.5px', color: '#EC9424', fontWeight: 700 }}>
                  {order.payment_method}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
               <div style={{ fontSize: isGrid ? '11px' : '13px', fontWeight: 800, color: '#EC9424' }}>
                 R$ {order.total?.toFixed(2)}
               </div>
               <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={(e) => { e.stopPropagation(); handlePrint(order); }} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '5px', color: '#a1a1aa' }}>
                    <Printer size={12} />
                  </button>
                  <DeleteButton order={order} updateStatus={updateStatus} />
               </div>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <ActionButton order={order} updateStatus={updateStatus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Modo Compacto Retraído, mostra apenas o valor e nome */}
      {isCompact && !isExpanded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ fontSize: '10px', color: '#71717a' }}>{order.items?.length || 0} itens • {order.payment_method}</div>
           <div style={{ fontSize: '13px', fontWeight: 800, color: '#EC9424' }}>R$ {order.total?.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};

import { useDroppable } from '@dnd-kit/core';

// === COMPONENTE COLUNA ===
const KanbanColumn = ({ column, orders, handlePrint, updateStatus }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'transparent',
      width: '360px',
      minWidth: '360px',
      height: '100%',
      maxHeight: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px', 
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '10px',
        flexShrink: 0
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: column.color }} />
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0', letterSpacing: '0.3px' }}>{column.title}</h3>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', color: '#71717a', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div 
            className="kanban-scroll"
            style={{ 
              flex: 1,
              background: 'transparent',
              borderRadius: '12px', 
              padding: '4px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            <style>
              {`
                .kanban-scroll::-webkit-scrollbar {
                  width: 5px;
                }
                .kanban-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .kanban-scroll::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 10px;
                }
                .kanban-scroll:hover::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.15);
                }
              `}
            </style>
            {orders.map(order => (
              <SortableOrderCard key={order.id} order={order} handlePrint={handlePrint} updateStatus={updateStatus} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

// === COMPONENTE PRINCIPAL KANBAN ===
export const OrdersKanban = ({ orders, updateStatus, handlePrint, statusFilter, viewMode = 'list' }) => {
  const isMobile = useIsMobile();
  const [activeOrder, setActiveOrder] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Prevents drag when just clicking buttons
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mapeamento local caso a API atrase
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => {
    // Sincroniza localOrders quando orders muda (via props do DB)
    setLocalOrders(orders);
  }, [orders]);

  const handleDragStart = (event) => {
    const { active } = event;
    const order = localOrders.find(o => o.id === active.id);
    if (order) setActiveOrder(order);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    // We are finding which column we are dragging over, but Sortable handles internal array moves.
    // However, if we drag over an empty column we need to handle that. (Simplified for this version)
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveOrder(null);
    if (!over) return;

    const activeOrder = localOrders.find(o => o.id === active.id);
    const overId = over.id;
    
    // Encontrar o novo status com base no conteiner
    let newStatus = activeOrder.status;

    // Se o target for diretamente uma coluna (embora SortableContext devolva o ID do item, podemos inferir a coluna do item alvo)
    const overOrder = localOrders.find(o => o.id === overId);
    if (overOrder) {
      newStatus = overOrder.status;
    } else if (COLUMNS.some(c => c.id === overId)) {
      newStatus = overId; // Dropped on an empty column ID
    }

    // Se o status da ordem origem na verdade era 'pago', e estamos movendo para 'preparo', mapear ok
    if (newStatus === 'pago') newStatus = 'pendente'; // simplificação
    
    if (activeOrder && activeOrder.status !== newStatus) {
      // Optimistic update locally
      setLocalOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: newStatus } : o));
      // Database update
      updateStatus(activeOrder.id, newStatus);
    }
  };

  if (statusFilter === 'deleted') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '16px',
        padding: '20px 0',
        width: '100%'
      }}>
        {orders.length === 0 ? (
          <div style={{ color: '#71717a', fontSize: '14px', textAlign: 'center', width: '100%', padding: '40px' }}>Nenhum pedido excluído.</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {orders.map(order => (
              <motion.div key={order.id} layout layoutId={`card-${order.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                <OrderCard order={order} handlePrint={handlePrint} updateStatus={updateStatus} isDragging={false} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // VIEW MOBILE: Lista vertical otimizada
  if (isMobile) {
    const filteredByStatus = statusFilter === 'all' 
      ? localOrders.filter(o => o.status !== 'excluido')
      : localOrders.filter(o => {
          const s = String(o.status || '').toLowerCase().trim();
          const f = statusFilter.toLowerCase();
          if (f === 'pending') return s === 'pendente' || s === 'pago' || s === '';
          return s === f;
        });

    return (
      <div style={{ 
        display: isMobile && viewMode === 'grid' ? 'grid' : 'flex', 
        gridTemplateColumns: viewMode === 'grid' ? '1fr 1fr' : 'none',
        flexDirection: 'column', 
        gap: '12px', 
        padding: '0 0 120px 0',
        width: '100%',
        overflowY: 'visible' // Para permitir que o main controle o scroll
      }}>
        {filteredByStatus.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%', 
            padding: '60px 20px',
            textAlign: 'center',
            color: '#71717a', 
            fontSize: '14px'
          }}>
            Nenhum pedido encontrado nesta categoria.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredByStatus.map(order => (
              <motion.div key={order.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <OrderCard order={order} handlePrint={handlePrint} updateStatus={updateStatus} isDragging={false} viewMode={viewMode} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // VIEW DESKTOP: Quadro Kanban Original
  return (
    <div 
      className="kanban-board-scroll"
      style={{
        width: '100%',
        height: 'calc(100vh - 180px)',
        background: '#050506',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        borderRadius: '8px',
        border: 'none',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '30px'
      }}
    >
      <style>
        {`
          .kanban-board-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .kanban-board-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .kanban-board-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .kanban-board-scroll:hover::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
          }
        `}
      </style>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
          {COLUMNS.map(column => {
            const columnOrders = localOrders.filter(o => {
               const s = String(o.status || '').toLowerCase().trim();
               const colId = column.id.toLowerCase();
               if (colId === 'pendente') return s === 'pendente' || s === 'pago' || s === '';
               return s === colId;
            });

            return (
               <div key={column.id} id={column.id}>
                  <KanbanColumn 
                    column={column} 
                    orders={columnOrders} 
                    handlePrint={handlePrint} 
                    updateStatus={updateStatus} 
                  />
               </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
          {activeOrder ? <OrderCard order={activeOrder} handlePrint={handlePrint} updateStatus={updateStatus} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
