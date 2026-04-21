import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Printer, Clock, Trash2, MapPin, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
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

const MinimalistTimer = ({ createdAt, size = 30 }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30); // Atualiza a cada 30s
    return () => clearInterval(timer);
  }, []);

  const createdTime = new Date(createdAt);
  if (isNaN(createdTime.getTime())) return null; // Prevenir crash se data for inválida
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

  const fontSize = size > 35 ? '10px' : '8px';
  const stroke = 3;
  const radius = (size / 2) - stroke;
  const circumference = 2 * Math.PI * radius;
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
      <div style={{ position: 'absolute', fontSize: fontSize, fontWeight: 900, color: color, textAlign: 'center', fontFamily: 'monospace' }}>
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

  if (order.status === 'excluido') return null;

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
  { id: 'preparo', title: 'Em preparo', color: '#b45309' },
  { id: 'pronto', title: 'Pronto', color: '#0369a1' },
  { id: 'entrega', title: 'Saiu p/ entrega', color: '#6b21a8' },
  { id: 'concluido', title: 'Concluído', color: '#0f766e' },
  { id: 'pendente', title: 'Fila Geral', color: '#71717a' }
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
  const isCompact = viewMode === 'compact';
  
  if (!order) return null;
  const orderTime = new Date(order.created_at || order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = String(order.id || '').slice(-4);

  const getStatusLabel = (s) => {
    switch(s) {
      case 'pendente': return 'FILA GERAL';
      case 'preparo': return 'EM PREPARO';
      case 'pronto': return 'PRONTO';
      case 'entrega': return 'SAIU P/ ENTREGA';
      case 'concluido': return 'CONCLUÍDO';
      default: return s?.toUpperCase();
    }
  };

  return (
    <div 
      onClick={() => (isGrid || isCompact) && setIsExpanded(!isExpanded)}
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: (isGrid || isCompact) ? '0' : '14px',
        boxShadow: isDragging ? '0 12px 48px rgba(0,0,0,0.7)' : '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {(!isMobile || order.status !== 'concluido') ? (
          <div style={{ 
            color: isMobile ? '#71717a' : statusColor, 
            padding: isMobile ? '0' : '4px 10px', 
            borderRadius: '8px', 
            fontSize: isMobile ? '13px' : '10px', 
            fontWeight: isMobile ? 500 : 900,
            letterSpacing: '0.05em',
            background: isMobile ? 'none' : `${statusColor}22`,
            border: isMobile ? 'none' : `1px solid ${statusColor}44`,
            textTransform: isMobile ? 'none' : 'uppercase'
          }}>
            {isMobile ? getStatusLabel(order.status).toLowerCase().replace(/^\w/, c => c.toUpperCase()) : getStatusLabel(order.status)}
          </div>
        ) : <div />}
        {(isGrid || isCompact) && (
          <div style={{ color: '#71717a' }}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              #{displayId} • {order.address?.customerName?.split(' ')[0] || 'Cliente'}
            </h3>
          </div>
          <div style={{ fontSize: '12px', color: '#52525b', fontWeight: 500, marginBottom: '8px' }}>
            Mel Burgers
          </div>
          {!isMobile && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              background: 'rgba(255,255,255,0.04)', 
              padding: '4px 10px', 
              borderRadius: '8px',
              fontSize: '11px',
              color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <ShoppingBag size={10} />
              Própria
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <MinimalistTimer createdAt={order.created_at || order.timestamp} size={isMobile ? 44 : 30} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#3f3f46' }}>{orderTime}</span>
        </div>
      </div>

      <AnimatePresence>
        {(viewMode === 'list' || isExpanded) && (
          <motion.div
            initial={(isGrid || isCompact) ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '12px', 
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.04)',
              marginBottom: '12px'
            }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '4px', fontWeight: 600 }}>
                  <span style={{ color: '#71717a', marginRight: '8px' }}>{item.quantity}x</span>
                  {item.name}
                </div>
              ))}
            </div>

            {order.address?.street && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
                <MapPin size={14} style={{ color: '#71717a', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.4' }}>
                  {order.address.street}, {order.address.number} • {order.address.neighborhood}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {isMobile ? (
                <>
                  <div style={{ flex: 1, marginRight: '15px' }}>
                    <ActionButton order={order} updateStatus={updateStatus} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#EC9424', whiteSpace: 'nowrap' }}>
                    R$ {order.total?.toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#EC9424' }}>
                      R$ {order.total?.toFixed(2)}
                    </div>
                    {order.payment_method && (
                      <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>
                         • {order.payment_method}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '8px', borderRadius: '10px' }}>
                        <MessageSquare size={16} />
                      </a>
                    )}
                    {!isMobile && (
                      <button onClick={(e) => { e.stopPropagation(); handlePrint(order); }} style={{ background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Printer size={16} />
                      </button>
                    )}
                    <DeleteButton order={order} updateStatus={updateStatus} />
                  </div>
                </>
              )}
            </div>
            
            {!isMobile && (
              <div style={{ marginTop: '16px' }}>
                <ActionButton order={order} updateStatus={updateStatus} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(isGrid || isCompact) && !isExpanded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
           <div style={{ fontSize: '13px', fontWeight: 900, color: '#EC9424' }}>R$ {order.total?.toFixed(2)}</div>
           <div style={{ fontSize: '10px', color: '#52525b', fontWeight: 700 }}>{order.items?.length || 0} ITENS</div>
        </div>
      )}
    </div>
  );
};



const KanbanColumn = ({ column, orders, handlePrint, updateStatus }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '360px', minWidth: '360px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: column.color }} />
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>{column.title}</h3>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', color: '#71717a', fontSize: '10px', padding: '2px 8px', borderRadius: '6px' }}>{orders.length}</span>
      </div>
      <div ref={setNodeRef} style={{ flex: 1, minHeight: 0 }}>
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div className="kanban-scroll" style={{ flex: 1, padding: '4px', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <style>{`
              .kanban-scroll::-webkit-scrollbar { width: 5px; }
              .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
            {orders.map(order => <SortableOrderCard key={order.id} order={order} handlePrint={handlePrint} updateStatus={updateStatus} />)}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const OrdersKanban = ({ orders, updateStatus, handlePrint, statusFilter, viewMode = 'list' }) => {
  const isMobile = useIsMobile();
  const [activeOrder, setActiveOrder] = useState(null);
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => { setLocalOrders(orders); }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }) => setActiveOrder(localOrders.find(o => o.id === active.id));
  const handleDragEnd = ({ active, over }) => {
    setActiveOrder(null);
    if (!over) return;
    const activeOrder = localOrders.find(o => o.id === active.id);
    const overId = over.id;
    let newStatus = COLUMNS.some(c => c.id === overId) ? overId : localOrders.find(o => o.id === overId)?.status;
    if (activeOrder && newStatus && activeOrder.status !== newStatus) {
      setLocalOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: newStatus } : o));
      updateStatus(activeOrder.id, newStatus);
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
        {COLUMNS.filter(col => statusFilter === 'all' || statusFilter === col.id).map(column => {
          const colOrders = localOrders.filter(o => o.status === column.id || (column.id === 'pendente' && (o.status === 'pago' || !o.status)));
          if (colOrders.length === 0 && statusFilter !== column.id) return null;
          
          return (
            <div key={column.id} style={{ marginBottom: '8px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '4px 8px', 
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronDown size={14} style={{ color: '#71717a' }} />
                  <span style={{ fontSize: '15px', color: '#71717a', fontWeight: 500 }}>
                    {column.title}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#52525b' }}>{colOrders.length} pedidos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colOrders.map(order => (
                  <OrderCard key={order.id} order={order} handlePrint={handlePrint} updateStatus={updateStatus} viewMode={viewMode} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="kanban-board-scroll" style={{ width: '100%', height: 'calc(100vh - 180px)', background: '#050506', overflowX: 'auto', padding: '30px' }}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
          {COLUMNS.map(column => (
            <KanbanColumn key={column.id} column={column} orders={localOrders.filter(o => o.status === column.id || (column.id === 'pendente' && (o.status === 'pago' || !o.status)))} handlePrint={handlePrint} updateStatus={updateStatus} />
          ))}
        </div>
        <DragOverlay>{activeOrder && <OrderCard order={activeOrder} handlePrint={handlePrint} updateStatus={updateStatus} isDragging />}</DragOverlay>
      </DndContext>
    </div>
  );
};
