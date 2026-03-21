import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Package, Droplet, Plus, Trash2, Edit } from 'lucide-react';
import API from '../api';
import { InventoryModal } from '../components/InventoryModal';
import { GeneralInventoryModal } from '../components/GeneralInventoryModal';

export const Inventory = () => {
  const [generalItems, setGeneralItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isBloodModalOpen, setIsBloodModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const generalRes = await API.get('/inventory/general');
      setGeneralItems(generalRes.data.items || []);
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteGeneral = async (id: string, category: string) => {
    if (category === "BLOOD") {
      alert("Blood stock cannot be directly deleted via General Inventory, please use the Blood bank flow or set to zero via edit if allowed.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await API.delete(`/inventory/general/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting item", error);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'BLOOD': return 'danger';
      case 'MONEY': return 'success';
      case 'CLOTHES': return 'info';
      default: return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventory Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Unified tracker for organization resources, funds, materials, and blood stock.</p>
         </div>
         <div className="flex gap-3">
            <Button 
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 shadow-red-500/30 text-white"
              onClick={() => { setEditingItem(null); setIsBloodModalOpen(true); }}
            >
               <Droplet size={18} /> Add Blood
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => { setEditingItem(null); setIsGeneralModalOpen(true); }}
            >
               <Plus size={18} /> Add General Item
            </Button>
         </div>
      </div>

      <Card className="p-6 border-t-4 border-primary-500">
         <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">All Organization Inventory</h2>
         </div>
         {loading ? (
             <div className="text-center py-10 text-slate-500">Loading inventory...</div>
         ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <tr>
                         <th className="p-3">Item Name</th>
                         <th className="p-3">Category</th>
                         <th className="p-3">Details</th>
                         <th className="p-3">Stock Level</th>
                         <th className="p-3">Last Updated</th>
                         <th className="p-3 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {generalItems.map(item => (
                         <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                               <div className="flex items-center gap-2">
                                  {item.category === "BLOOD" ? <Droplet size={16} className="text-red-500" /> : <Package size={16} className="text-primary-500" />} 
                                  {item.name}
                               </div>
                            </td>
                            <td className="p-3">
                               <Badge variant={getCategoryBadge(item.category)}>{item.category}</Badge>
                            </td>
                            <td className="p-3">
                               {item.category === "CLOTHES" && item.details ? (
                                   <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-1 rounded inline-block">
                                      Size: <strong className="text-slate-700 dark:text-slate-300">{item.details.size}</strong> | Type: {item.details.type}
                                   </div>
                               ) : (
                                   <span className="text-xs text-slate-400">—</span>
                               )}
                            </td>
                            <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                               {item.quantity.toLocaleString()} <span className="font-normal text-slate-500 ml-1">{item.unit}</span>
                            </td>
                            <td className="p-3 text-slate-500">{new Date(item.lastUpdated || item.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 flex gap-2 justify-end">
                               {item.category !== "BLOOD" && (
                                   <button 
                                      className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                      onClick={() => { setEditingItem(item); setIsGeneralModalOpen(true); }}
                                   >
                                      <Edit size={16} />
                                   </button>
                               )}
                               <button 
                                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors block ml-auto disabled:opacity-30"
                                  onClick={() => handleDeleteGeneral(item.id, item.category)}
                               >
                                  <Trash2 size={16} />
                               </button>
                            </td>
                         </tr>
                      ))}
                      {generalItems.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-8 text-slate-500">No inventory found for your organization.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
         )}
      </Card>

      <InventoryModal 
        isOpen={isBloodModalOpen}
        onClose={() => setIsBloodModalOpen(false)}
        onSuccess={fetchData}
        inventoryItem={editingItem}
      />

      <GeneralInventoryModal
        isOpen={isGeneralModalOpen}
        onClose={() => setIsGeneralModalOpen(false)}
        onSuccess={fetchData}
        inventoryItem={editingItem}
      />
    </div>
  );
};