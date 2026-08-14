import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * مكون إدارة العناصر المحددة في مصمم القائمة الجانبية
 */
export default function SidebarItemsManager({ 
  selectedIds, 
  setSelectedIds, 
  currentItems, 
  onDeleteSelected 
}) {
  const handleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map(item => item.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`هل تريد حذف ${selectedIds.size} عنصر؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    onDeleteSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return {
    handleSelectAll,
    handleDelete,
    selectionCount: selectedIds.size,
    isAllSelected: selectedIds.size === currentItems.length && currentItems.length > 0
  };
}

export function SelectionToolbar({ 
  selectedIds, 
  setSelectedIds, 
  currentItems, 
  onDeleteSelected 
}) {
  const manager = SidebarItemsManager({ 
    selectedIds, 
    setSelectedIds, 
    currentItems, 
    onDeleteSelected 
  });

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={manager.isAllSelected}
          onChange={manager.handleSelectAll}
          className="cursor-pointer"
        />
        <span className="text-sm font-bold">تحديد الكل ({currentItems.length})</span>
      </label>
      
      {selectedIds.size > 0 && (
        <>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary text-white">
            {selectedIds.size} محدد
          </span>
          <button
            onClick={manager.handleDelete}
            className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Trash2 size={14} />
            حذف المحدد
          </button>
        </>
      )}
    </div>
  );
}