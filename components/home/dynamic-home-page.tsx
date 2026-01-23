
"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getLayout, SectionConfig, saveLayout, resetLayout } from "@/lib/layout-config";
import { SECTION_COMPONENTS } from "./section-registry";
import { LayoutEditor } from "../admin/layout-editor";
import { localGetUser } from "@/lib/local-auth";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, Layout, Save, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditModeProvider, useEditMode } from "../admin/edit-mode-context";

function DynamicHomePageContent() {
  const [layout, setLayout] = useState<SectionConfig[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { isAdmin, isEditing, setIsEditing } = useEditMode();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLayout(getLayout());
    
    const handleLayoutChange = () => {
      setLayout(getLayout());
    };

    window.addEventListener("layout-change", handleLayoutChange);
    return () => window.removeEventListener("layout-change", handleLayoutChange);
  }, []);

  const handleReorder = (newOrder: SectionConfig[]) => {
     const updatedVisible = newOrder.map((item, index) => ({
         ...item,
         order: index // Assign 0, 1, 2... to visible items
     }));
     
     // Get hidden items
     const hiddenItems = layout.filter(item => !item.isVisible);
     const updatedHidden = hiddenItems.map((item, index) => ({
         ...item,
         order: updatedVisible.length + index
     }));
     
     const finalLayout = [...updatedVisible, ...updatedHidden];
     setLayout(finalLayout);
     setHasChanges(true);
  };
  
  const handleSave = () => {
    saveLayout(layout);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleReset = () => {
    resetLayout();
    setHasChanges(false);
  };

  // Subset for Reorder.Group
  const visibleLayout = layout.filter(s => s.isVisible).sort((a, b) => a.order - b.order);

  if (!isClient) {
    return (
        <div className="min-h-screen bg-dark-950">
            <Header />
            <div className="animate-pulse space-y-32 py-20">
                <div className="h-[80vh] bg-dark-900/50 w-full" />
                <div className="h-96 bg-dark-900/50 w-full container mx-auto" />
            </div>
            <Footer />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <Header />
      
      <main className="flex flex-col min-h-screen">
        {isEditing ? (
            <Reorder.Group axis="y" values={visibleLayout} onReorder={handleReorder} className="flex flex-col gap-4 py-4">
                {visibleLayout.map(section => {
                    const Component = SECTION_COMPONENTS[section.componentKey];
                    if (!Component) return null;
                    return (
                        <Reorder.Item key={section.id} value={section} className="relative group">
                             {/* Drag Overlay */}
                            <div className="absolute inset-0 border-2 border-dashed border-primary-500/50 rounded-lg z-10 pointer-events-none group-hover:border-primary-500 transition-colors" />
                            
                            {/* Drag Handle */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-primary-600 text-white p-2 rounded cursor-grab active:cursor-grabbing shadow-lg flex items-center gap-2">
                                <GripVertical className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Arrastar</span>
                            </div>

                            <div className="">
                                <Component />
                            </div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>
        ) : (
            // Static View
            layout
            .filter(section => section.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(section => {
                const Component = SECTION_COMPONENTS[section.componentKey];
                if (!Component) return null;
                return (
                    <div key={section.id} id={section.id}>
                        <Component />
                    </div>
                );
            })
        )}
      </main>

      <Footer />
      
      {/* Admin Toolbar - Visual Editor */}
      {isAdmin && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-dark-900/90 backdrop-blur border border-gray-700 p-2 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 fade-in">
             {!isEditing ? (
                 <Button onClick={() => setIsEditing(true)} size="sm" className="rounded-full">
                     <Layout className="h-4 w-4 mr-2" />
                     Editor Visual
                 </Button>
             ) : (
                 <>
                    <div className="px-3 text-sm font-medium text-white border-r border-gray-700 mr-1">
                        Modo Edição
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white rounded-full">
                        Cancelar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset} className="border-gray-700 text-gray-300 hover:text-white hover:bg-dark-800 rounded-full">
                        <RotateCcw className="h-3 w-3 mr-2" />
                        Resetar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="bg-primary-600 hover:bg-primary-700 text-white rounded-full">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                    </Button>
                 </>
             )}
        </div>
      )}

      {/* Admin Layout Editor - Side Panel (Navigator) */}
      <LayoutEditor />
    </div>
  );
}

export function DynamicHomePage() {
    return (
        <EditModeProvider>
            <DynamicHomePageContent />
        </EditModeProvider>
    );
}
