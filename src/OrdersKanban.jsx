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
import { MessageSquare, Printer, Clock, CheckCircle } from 'lucide-react';

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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard order={order} handlePrint={handlePrint} updateStatus={updateStatus} isDragging={isDragging} />
    </div>
  );
};

// === COMPONENTE VISUAL DO CARD ===
const OrderCard = ({ order, handlePrint, updateStatus, isDragging }) => {
  const clientPhone = order.address?.customerPhone?.replace(/\D/g, '');
  const waLink = clientPhone ? `https://wa.me/55${clientPhone}` : null;
  const timeElapsed = Math.floor((new Date() - new Date(order.created_at || order.timestamp)) / 60000);

  return (
    <div style={{
      background: '#111113', // Superfície premium escura
      border: '1px solid rgba(255,255,255,0.06)', // Borda muito elegante
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.2)',
      cursor: 'grab',
      transition: 'box-shadow 0.25s ease',
      position: 'relative'
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
      <div style={{ borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: '10px', marginBottom: '16px', fontSize: '11.5px', color: '#a1a1aa', maxHeight: '55px', overflowY: 'auto' }}>
        {order.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: '3px', fontWeight: 400 }}>{item.quantity}x {item.name}</div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: '#71717a', marginBottom: '2px' }}>Total</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>R$ {order.total?.toFixed(2)}</span>
        </div>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#71717a', transition: 'all 0.2s' }}
        >
          <Printer size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {waLink && (
          <a 
            onPointerDown={(e) => e.stopPropagation()} 
            href={waLink} target="_blank" rel="noreferrer" 
            style={{ flex: 1, background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.06)', padding: '6px', borderRadius: '6px', fontSize: '10px', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
          >
            <MessageSquare size={12} /> WhatsApp
          </a>
        )}
        {order.status === 'pendente' && (
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => updateStatus(order.id, 'pago')}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', padding: '6px', borderRadius: '6px', fontSize: '10px', border: '1px solid rgba(255,255,255,0.04)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Confirmar Pago
          </button>
        )}
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
      width: '280px',
      minWidth: '280px',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: column.color }} />
        <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>{column.title}</h3>
        <span style={{ marginLeft: 'auto', color: '#52525b', fontSize: '11px', fontWeight: 500 }}>
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
export const OrdersKanban = ({ orders, updateStatus, handlePrint }) => {
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
