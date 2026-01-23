
"use client";

import { useState, useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, X, Save, RotateCcw, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEditMode } from "./edit-mode-context";
import { getLayout, saveLayout, resetLayout, SectionConfig } from "@/lib/layout-config";

export function LayoutEditor() {
  const { isAdmin } = useEditMode();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SectionConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setItems(getLayout());
    }
  }, [isAdmin]);

  // Update local items when global layout changes (if we reset)
  useEffect(() => {
    const handleLayoutChange = () => {
      setItems(getLayout());
    };
    window.addEventListener("layout-change", handleLayoutChange);
    return () => window.removeEventListener("layout-change", handleLayoutChange);
  }, []);

  const handleReorder = (newOrder: SectionConfig[]) => {
    // Update the 'order' property based on index
    const updated = newOrder.map((item, index) => ({
      ...item,
      order: index
    }));
    setItems(updated);
    setHasChanges(true);
  };

  const toggleVisibility = (id: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    );
    setItems(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveLayout(items);
    setHasChanges(false);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetLayout();
    setHasChanges(false);
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 left-6 z-50 bg-dark-800/80 backdrop-blur border border-gray-700 hover:bg-dark-700 text-white shadow-xl"
        >
          <Layout className="h-4 w-4 mr-2" />
          Editar Layout
        </Button>
      )}

      {/* Editor Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 bg-dark-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl p-4 animate-in slide-in-from-left-5 fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Layout className="h-4 w-4 text-primary-500" />
              Editor de Seções
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Arraste para reordenar ou oculte seções do site.
          </p>

          <Reorder.Group 
            axis="y" 
            values={items} 
            onReorder={handleReorder}
            className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto pr-1"
          >
            {items.map((item) => (
              <Reorder.Item key={item.id} value={item}>
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border bg-dark-800/50 cursor-grab active:cursor-grabbing group transition-colors",
                  item.isVisible ? "border-gray-700 hover:border-gray-600" : "border-gray-800 opacity-60"
                )}>
                  <GripVertical className="h-5 w-5 text-gray-500 group-hover:text-gray-300" />
                  
                  <span className={cn(
                    "flex-1 text-sm font-medium",
                    item.isVisible ? "text-white" : "text-gray-500 line-through"
                  )}>
                    {item.label}
                  </span>

                  <Switch 
                    checked={item.isVisible}
                    onCheckedChange={() => toggleVisibility(item.id)}
                    className="scale-75"
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="grid grid-cols-2 gap-2">
            <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
                className="border-gray-700 text-gray-400 hover:text-white hover:bg-dark-800"
            >
                <RotateCcw className="h-3 w-3 mr-2" />
                Resetar
            </Button>
            <Button 
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-primary-600 hover:bg-primary-700 text-white"
            >
                <Save className="h-3 w-3 mr-2" />
                Salvar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
