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
import { MessageSquare, Printer, Clock, Trash2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      btnText = 'Confirmar Pagamento';
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
        flex: 1, 
        background: isHovered ? hoverBg : 'rgba(255,255,255,0.04)', 
        color: isHovered ? '#ffffff' : '#e2e8f0', 
        padding: '8px', 
        borderRadius: '8px', 
        fontSize: '11px', 
        border: '1px solid ' + (isHovered ? hoverBorder : 'rgba(255,255,255,0.04)'), 
        fontWeight: isHovered ? 600 : 500, 
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
const OrderCard = ({ order, handlePrint, updateStatus, isDragging }) => {
  const clientPhone = order.address?.customerPhone?.replace(/\D/g, '');
  const waLink = clientPhone ? `https://wa.me/55${clientPhone}` : null;
  const timeElapsed = Math.floor((new Date() - new Date(order.created_at || order.timestamp)) / 60000);

  const statusColor = STATUS_COLORS[order.status] || '#71717a';

  return (
    <div style={{
      background: '#111113', // Superfície premium escura
      border: '1px solid rgba(255,255,255,0.06)', // Borda externa fina
      borderLeft: `3px solid ${statusColor}`, // Barra lateral de status
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.2)',
      cursor: 'grab',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: 500, fontSize: '11px', color: '#71717a', letterSpacing: '0.5px' }}>#{order.id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#71717a', fontWeight: 400 }}>
          <Clock size={12} style={{ opacity: 0.7 }} /> {timeElapsed} min
        </div>
      </div>

      <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 500, marginBottom: '12px', letterSpacing: '-0.3px' }}>
        {order.address?.customerName || 'Cliente sem nome'}
      </div>

      {/* Resumo sutil dos itens */}
      <div style={{ borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '10px', marginBottom: '16px', fontSize: '11.5px', color: '#a1a1aa', maxHeight: '120px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {order.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: '3px', fontWeight: 400 }}>{item.quantity}x {item.name}</div>
        ))}
      </div>

      {/* Bloco de Endereço Premium */}
      {order.address?.street && (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderLeft: '2px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          padding: '10px 12px',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <MapPin size={14} style={{ color: '#71717a', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11.5px', color: '#f8fafc', fontWeight: 500, lineHeight: '1.4' }}>
              {order.address.street}, {order.address.number}
            </span>
            <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: 400 }}>
              {order.address.neighborhood} • {order.address.city}
            </span>
            {(order.address.complement || order.address.reference) && (
              <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 400, fontStyle: 'italic', marginTop: '2px' }}>
                {order.address.complement && `Compl: ${order.address.complement}`}
                {order.address.complement && order.address.reference && ' | '}
                {order.address.reference && `Ref: ${order.address.reference}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px' }}>Total</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>R$ {order.total?.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <DeleteButton order={order} updateStatus={updateStatus} />
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#71717a', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Printer size={12} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {waLink && (
          <a 
            onPointerDown={(e) => e.stopPropagation()} 
            href={waLink} target="_blank" rel="noreferrer" 
            style={{ flex: 1, background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.06)', padding: '8px', borderRadius: '8px', fontSize: '11px', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
          </a>
        )}
        <ActionButton order={order} updateStatus={updateStatus} />
      </div>
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
      height: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px', 
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '10px'
      }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: column.color }} />
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0', letterSpacing: '0.3px' }}>{column.title}</h3>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.04)', color: '#71717a', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ flex: 1 }}>
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div style={{ 
            height: '100%', 
            background: 'transparent',
            borderRadius: '12px', 
            padding: '4px',
            overflowY: 'auto',
            minHeight: '400px'
          }}>
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
export const OrdersKanban = ({ orders, updateStatus, handlePrint, statusFilter }) => {
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

  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 150px)',
      background: '#050506',
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      borderRadius: '8px',
      border: 'none',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '30px'
    }}>
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
               // Compatibilidade com status antigos
               if (column.id === 'pendente') return o.status === 'pendente' || o.status === 'pago';
               return o.status === column.id;
            });

            return (
               // Para deixar a coluna inteira "droppable" mesmo vazia, envolvemos no SortableContext id
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
