import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MoreHorizontal, UserPlus, MapPin, 
  Truck, Link as LinkIcon, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuData } from './data/menu';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('Lanches');
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  const categories = Object.keys(menuData.menu);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="app-container">
      {/* Compact Instagram Header */}
      <header className="insta-header">
        <div className="profile-top">
          <div className="avatar-wrapper">
            <div className="avatar-inner">
              <img src="/perfil.png" alt="Mel Burgers Logo" />
            </div>
          </div>
          
          <div className="profile-title-area">
            <div className="username-row">
              <h2>melburgerrs</h2>
              <div className="verified-badge">
                <BadgeCheck size={20} fill="currentColor" stroke="white" />
              </div>
              <MoreHorizontal size={20} style={{ marginLeft: 'auto', color: '#8e8e8e' }} />
            </div>
            <div className="display-name">Mel Burger's 🍔</div>
            <div className="category-text">Restaurante</div>
          </div>
        </div>

        <div className="bio-area">
          <div className="bio-text">
            Mel Burgers 🍔 <br />
            Sabor que conquista na primeira mordida ✨ <br />
            <Truck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Somente Delivery <br />
            <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Tamoios • Cabo Frio 🌴 <br />
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Seg a Seg • 19h às 01h
          </div>

        </div>

        <div className="header-actions">
          <button className="action-btn btn-primary">Seguir</button>
          <button className="action-btn btn-secondary btn-icon" style={{ position: 'relative' }}>
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="cart-badge-mini">{cart.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Category Nav */}
      <nav className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Menu List */}
      <main className="menu-section">
        <h2 className="section-title">{activeCategory}</h2>
        
        <div className="items-grid">
          <AnimatePresence mode="wait">
            {menuData.menu[activeCategory].map((item, index) => (
              <motion.div
                key={item.id}
                className="menu-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="card-img">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="card-info">
                  <div className="card-header">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="card-footer">
                    <div className="price-container">
                      {item.original_price && (
                        <span className="price-old">R$ {item.original_price.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="price-tag">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button className="add-btn" onClick={() => addToCart(item)}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Info */}
      <footer style={{ padding: '0 20px 120px', textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
        <p>Aberto das 19h às 1h</p>
        <p>Desenvolvido com ❤️ para Mel Burgers</p>
      </footer>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <motion.div
          className="cart-floating"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="cart-info">
            <span className="cart-count">{cart.length}</span>
            <div className="cart-view-text">Ver Carrinho</div>
          </div>
          <div className="cart-price">
            R$ {cartTotal.toFixed(2).replace('.', ',')}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default App;
