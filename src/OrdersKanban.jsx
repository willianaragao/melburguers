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
  { id: 'pendente', title: 'Fila Geral', color: '#64748b' },
  { id: 'preparo', title: 'Em Preparo', color: '#EC9424' },
  { id: 'pronto', title: 'Pronto', color: '#3b82f6' },
  { id: 'entrega', title: 'Saiu p/ Entrega', color: '#a855f7' },
  { id: 'concluido', title: 'Concluído', color: '#22c55e' }
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
      background: '#0B0B0F',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '14px',
      marginBottom: '12px',
      boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.2)',
      cursor: 'grab',
      transition: 'box-shadow 0.2s',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontWeight: 900, fontSize: '13px', color: '#ffffff' }}>#{order.id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
          <Clock size={10} /> {timeElapsed} min
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700, marginBottom: '8px' }}>
        {order.address?.customerName || 'Cliente'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', marginBottom: '10px', fontSize: '10px', color: '#94a3b8', maxHeight: '60px', overflowY: 'auto' }}>
        {order.items?.map((item, i) => (
          <div key={i} style={{ marginBottom: '2px' }}>{item.quantity}x {item.name}</div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#00ff88' }}>
          R$ {order.total?.toFixed(2)}
        </div>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
          style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#94a3b8' }}
        >
          <Printer size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {waLink && (
          <a 
            onPointerDown={(e) => e.stopPropagation()} 
            href={waLink} target="_blank" rel="noreferrer" 
            style={{ flex: 1, background: '#22c55e', color: 'black', padding: '6px', borderRadius: '8px', fontSize: '9px', textDecoration: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <MessageSquare size={10} /> Whats
          </a>
        )}
        {order.status === 'pendente' && (
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => updateStatus(order.id, 'pago')}
            style={{ flex: 1, background: '#2563eb', color: 'white', padding: '6px', borderRadius: '8px', fontSize: '9px', border: 'none', fontWeight: 800, cursor: 'pointer' }}
          >
            PAGAR
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '0 10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color, boxShadow: `0 0 10px ${column.color}` }} />
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.5px' }}>{column.title}</h3>
        <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} style={{ flex: 1 }}>
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div style={{ 
            height: '100%', 
            background: 'rgba(255, 255, 255, 0.01)', 
            border: '1px solid rgba(255,255,255,0.03)',
            borderRadius: '20px', 
            padding: '12px',
            overflowY: 'auto',
            minHeight: '200px'
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
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.05)',
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
