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
import { MessageSquare, Printer, Clock, Trash2, MapPin, ShoppingBag, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.035c0 2.123.553 4.197 1.604 6.006L0 24l6.111-1.604a11.83 11.83 0 005.933 1.597h.005c6.634 0 12.032-5.397 12.035-12.037a11.78 11.78 0 00-3.489-8.507z"/>
  </svg>
);

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

  const fontSize = size > 50 ? '16px' : (size > 35 ? '12px' : '10px');
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
      <div style={{ position: 'absolute', fontSize: fontSize, fontWeight: 900, color: color, textAlign: 'center', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
        {displayMinutes}<span style={{ fontSize: '0.6em', opacity: 0.8, marginLeft: '1px' }}>m</span>
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

const DigitalTimer = ({ createdAt, isWarning }) => {
  const [time, setTime] = useState({ m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      setTime({
        m: Math.floor(diff / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px', 
      color: isWarning ? '#ef4444' : '#22c55e', 
      fontSize: '11px', 
      fontWeight: 800,
      marginTop: '10px',
      background: 'rgba(255,255,255,0.02)',
      padding: '4px 8px',
      borderRadius: '6px',
      width: 'fit-content'
    }}>
      <Clock size={10} />
      <span>{time.m}m {time.s}s</span>
    </div>
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
        padding: '10px 8px', 
        borderRadius: '12px', 
        fontSize: '11px', 
        border: '1px solid ' + (isHovered ? hoverBorder : 'rgba(255,255,255,0.04)'), 
        fontWeight: 700, 
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
  { id: 'preparo', title: 'Em preparo', color: '#b45309' },
  { id: 'pronto', title: 'Pronto', color: '#0369a1' },
  { id: 'entrega', title: 'Saiu p/ entrega', color: '#6b21a8' },
  { id: 'concluido', title: 'Concluído', color: '#0f766e' },
  { id: 'excluido', title: 'Lixeira', color: '#991b1b' }
];

// === COMPONENTE VISUAL DO CARD ===
const OrderCard = ({ order, handlePrint, updateStatus, isDragging, viewMode = 'list' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const clientPhone = (order.address?.phone || order.address?.customerPhone)?.replace(/\D/g, '');
  const waLink = clientPhone ? `https://wa.me/55${clientPhone}` : null;
  const isGrid = viewMode === 'grid';
  const isCompact = viewMode === 'compact';
  
  if (!order) return null;
  const orderTime = new Date(order.created_at || order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayId = String(order.id || '').slice(-4);

  // Time metrics for warning states
  const startTime = new Date(order.created_at || order.timestamp).getTime();
  const now = new Date().getTime();
  const elapsed = Math.floor((now - startTime) / 60000);
  const isWarning = elapsed > 30;
  const progress = Math.min((elapsed / 45) * 100, 100);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        background: '#111113',
        border: isExpanded ? '1px solid rgba(236,148,36,0.3)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: isDragging ? '0 12px 48px rgba(0,0,0,0.7)' : '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      {/* Header com Nome, Zap e Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '2px' }}>
            #{displayId} • {order.address?.customerName?.split(' ')[0] || 'Cliente'}
          </h3>
          <div style={{ fontSize: '11px', color: '#52525b', fontWeight: 500, marginBottom: '8px' }}>
            Mel Burgers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            {waLink && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(waLink, '_blank');
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                  background: 'rgba(34,197,94,0.1)', borderRadius: '10px', color: '#22c55e', 
                  border: '1px solid rgba(34,197,94,0.1)', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <WhatsAppIcon size={13} color="#22c55e" /> WhatsApp
              </button>
            )}
          </div>
          
          {isGrid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <DigitalTimer createdAt={order.created_at || order.timestamp} isWarning={isWarning} />
              <div style={{ 
                padding: '8px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', opacity: isExpanded ? 0.8 : 0.3,
                background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)', color: 'white'
              }}>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isGrid && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <MinimalistTimer createdAt={order.created_at || order.timestamp} size={isMobile ? 56 : 42} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3f3f46' }}>{orderTime}</span>
              </div>
            </div>
          )}
          <DeleteButton order={order} updateStatus={updateStatus} />
          {!isGrid && (
            <div style={{ color: '#3f3f46', marginLeft: '4px', opacity: 0.3 }}>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Expansível (Itens e Endereço) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px',
              border: '1px solid rgba(255,255,255,0.04)', marginBottom: '12px', marginTop: '4px'
            }}>
              <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em', fontWeight: 800 }}>Itens do Pedido</div>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '6px', fontWeight: 600, display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#52525b' }}>{item.quantity}x</span>
                  {item.product_name || item.name}
                </div>
              ))}
            </div>

            {order.address?.street && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '0 4px' }}>
                <MapPin size={14} style={{ color: '#71717a', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 800, color: '#52525b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Entrega</div>
                  {order.address.street}, {order.address.number} • {order.address.neighborhood}
                </div>
              </div>
            )}
            
            {!isMobile && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button onClick={(e) => { e.stopPropagation(); handlePrint(order); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', fontWeight: 600 }}>
                  <Printer size={16} /> Imprimir
                </button>
                <DeleteButton order={order} updateStatus={updateStatus} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER OPERACIONAL - FIXO NO CARD */}
      <div style={{ 
        marginTop: isCompact ? '6px' : '12px', 
        paddingTop: isCompact ? '6px' : '12px', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: isGrid ? 'column' : 'row',
        alignItems: isGrid ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isGrid ? '8px' : '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {isMobile && order.status !== 'pendente' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const prevMap = { 'preparo': 'pendente', 'pronto': 'preparo', 'entrega': 'pronto', 'concluido': 'entrega' };
                const prevStatus = prevMap[order.status];
                if (prevStatus) updateStatus(order.id, prevStatus);
              }}
              style={{ 
                width: isGrid ? '36px' : '42px', 
                height: isGrid ? '36px' : '40px', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.06)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={isGrid ? 16 : 20} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <ActionButton order={order} updateStatus={updateStatus} />
          </div>
        </div>
        
        <div style={{ textAlign: isGrid ? 'center' : 'right', marginLeft: isGrid ? 0 : '15px' }}>
          <div style={{ fontSize: isGrid ? '16px' : '18px', fontWeight: 900, color: '#EC9424', whiteSpace: 'nowrap' }}>
            R$ {order.total?.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// === COMPONENTE SORTABLE CARD WRAPPER ===
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard order={order} handlePrint={handlePrint} updateStatus={updateStatus} isDragging={isDragging} />
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
  
  const isCompact = viewMode === 'compact';
  const isGrid = viewMode === 'grid';

  // Fluency Sync: Only update local orders if the incoming data is substantively different
  useEffect(() => {
    const hasLengthChanged = localOrders.length !== orders.length;
    if (hasLengthChanged) {
      setLocalOrders(orders);
    }
  }, [orders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOptimisticUpdate = (orderId, newStatus) => {
    // Instant UI feedback with broader ID matching
    setLocalOrders(prev => prev.map(o => 
      (o.id === orderId || String(o.original_db_id) === String(orderId)) 
        ? { ...o, status: newStatus } 
        : o
    ));
    
    // Global update
    updateStatus(orderId, newStatus);
  };

  const handleDragStart = ({ active }) => setActiveOrder(localOrders.find(o => o.id === active.id));
  const handleDragEnd = ({ active, over }) => {
    setActiveOrder(null);
    if (!over) return;
    const activeOrder = localOrders.find(o => o.id === active.id);
    const overId = over.id;
    let newStatus = COLUMNS.some(c => c.id === overId) ? overId : localOrders.find(o => o.id === overId)?.status;
    if (activeOrder && newStatus && activeOrder.status !== newStatus) {
      handleOptimisticUpdate(activeOrder.id, newStatus);
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
        {COLUMNS.filter(col => statusFilter === 'all' || statusFilter === col.id).map(column => {
          const colOrders = localOrders.filter(o => o.status === column.id || (column.id === 'pendente' && (o.status === 'pago' || !o.status)));
          if (colOrders.length === 0 && statusFilter !== column.id) return null;
          
          return (
            <div key={column.id} style={{ marginBottom: isCompact ? '4px' : '8px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: isCompact ? '2px 8px' : '4px 8px', 
                marginBottom: isCompact ? '4px' : '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronDown size={14} style={{ color: '#71717a' }} />
                  <span style={{ fontSize: isCompact ? '13px' : '15px', color: '#71717a', fontWeight: 500 }}>
                    {column.title}
                  </span>
                </div>
                {!isCompact && <span style={{ fontSize: '12px', color: '#52525b' }}>{colOrders.length} pedidos</span>}
              </div>
              <div style={{ 
                display: isGrid ? 'grid' : 'flex', 
                flexDirection: isGrid ? 'unset' : 'column',
                gridTemplateColumns: isGrid ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'unset',
                gap: isCompact ? '8px' : '12px' 
              }}>
                {colOrders.map(order => (
                  <OrderCard key={order.id} order={order} handlePrint={handlePrint} updateStatus={handleOptimisticUpdate} viewMode={viewMode} />
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
            <KanbanColumn key={column.id} column={column} orders={localOrders.filter(o => o.status === column.id || (column.id === 'pendente' && (o.status === 'pago' || !o.status)))} handlePrint={handlePrint} updateStatus={handleOptimisticUpdate} />
          ))}
        </div>
        <DragOverlay>{activeOrder && <OrderCard order={activeOrder} handlePrint={handlePrint} updateStatus={handleOptimisticUpdate} isDragging />}</DragOverlay>
      </DndContext>
    </div>
  );
};
