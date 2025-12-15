// hooks/useInventoryList.js
import { useEffect, useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';

export const useInventoryList = (mode = 'user') => {
  const { 
    userInventories, 
    allInventories, 
    loading, 
    getUserInventories, 
    getAllInventories 
  } = useInventory();
  
  const [inventories, setInventories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Determinar qué datos usar según el modo
  useEffect(() => {
    if (mode === 'admin-all') {
      setInventories(allInventories);
    } else {
      setInventories(userInventories);
    }
  }, [mode, userInventories, allInventories]);

  // Función para refrescar
  const refresh = async () => {
    setRefreshing(true);
    try {
      if (mode === 'admin-all') {
        await getAllInventories();
      } else {
        await getUserInventories();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Estado de "vacío" con mensaje personalizado
  const getEmptyState = () => {
    if (loading) {
      return {
        isEmpty: false,
        message: 'Cargando inventarios...',
        subMessage: ''
      };
    }
    
    if (inventories.length === 0) {
      if (mode === 'admin-all') {
        return {
          isEmpty: true,
          message: 'No hay inventarios registrados',
          subMessage: 'Los usuarios aún no han creado inventarios'
        };
      } else {
        return {
          isEmpty: true,
          message: 'No has creado inventarios aún',
          subMessage: 'Crea tu primer inventario desde el botón "+"'
        };
      }
    }
    
    return { isEmpty: false };
  };

  // Título según el modo
  const getTitle = () => {
    const count = inventories.length;
    switch (mode) {
      case 'admin-all':
        return `Todos los Inventarios (${count})`;
      case 'admin':
        return `Mis Inventarios (${count})`;
      case 'user':
      default:
        return `Mis Inventarios (${count})`;
    }
  };

  return {
    inventories,
    loading,
    refreshing,
    emptyState: getEmptyState(),
    title: getTitle(),
    refresh,
    handleDetailsPress: (inventory) => {
      console.log('Ver detalles del inventario:', inventory.id);
      // Esta función la implementarás en cada pantalla
      // return navigation.navigate('inventory-details', { inventoryId: inventory.id });
    }
  };
};