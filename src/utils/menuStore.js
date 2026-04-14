import { menuData as defaultMenuData } from '../data/menu.js';

export const getMenuData = () => {
  const stored = localStorage.getItem('melburgers_menu');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored menu data", e);
    }
  }
  localStorage.setItem('melburgers_menu', JSON.stringify(defaultMenuData));
  return defaultMenuData;
};

export const saveMenuData = (newMenuData) => {
  localStorage.setItem('melburgers_menu', JSON.stringify(newMenuData));
};
