/**
 * AdminLandingPageEditor - Página principal do editor de Landing Page
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useLandingPageConfig } from '@/hooks/useLandingPageConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Layout,
  Rocket,
  Package,
  Trophy,
  Mail,
  Menu as MenuIcon,
} from 'lucide-react';
import {
  HeaderEditor,
  HeroEditor,
  AboutEditor,
  ProductsEditor,
  ExperienceEditor,
  ContactEditor,
  FooterEditor,
} from '@/components/admin/LandingPageEditor/SectionEditors';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionKey } from '@/types/landingPage';

export const AdminLandingPageEditor = () => {
  const {
    config,
    currentSection,
    isDirty,
    isSaving,
    isLoading,
    previewMode,
    showPreview,
    updateSection,
    save,
    reset,
    export: exportConfig,
    setCurrentSection,
    setPreviewMode,
    togglePreview,
  } = useLandingPageConfig();

  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const sections: Array<{ key: SectionKey; label: string; icon: any }> = [
    { key: 'header', label: 'Cabeçalho', icon: MenuIcon },
    { key: 'hero', label: 'Hero', icon: Rocket },
    { key: 'about', label: 'Sobre', icon: Layout },
    { key: 'products', label: 'Produtos', icon: Package },
    { key: 'experience', label: 'Experiência', icon: Trophy },
    { key: 'contact', label: 'Contato', icon: Mail },
    { key: 'footer', label: 'Rodapé', icon: Layout },
  ];

  const handleImport = () => {
    fileInputRef?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // Import logic would go here
          console.log('Import:', event.target?.result);
        } catch (error) {
          console.error('Error importing:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja realmente restaurar todas as configurações para os valores padrão?')) {
      reset();
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando editor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editor de Landing Page</h1>
            <p className="text-muted-foreground">
              Customize o conteúdo e estilo da sua landing page
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>

            <Button variant="outline" size="sm" onClick={exportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button onClick={save} disabled={!isDirty || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : isDirty ? 'Salvar *' : 'Salvo'}
            </Button>
          </div>
        </div>

        {/* Status */}
        {isDirty && (
          <Alert>
            <AlertDescription>
              Você tem alterações não salvas. Pressione <kbd className="px-2 py-1 bg-muted rounded">Ctrl+S</kbd> ou
              clique em Salvar.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Editor */}
          <div className="col-span-4">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Seções</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <Button
                            key={section.key}
                            variant={currentSection === section.key ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start"
                            onClick={() => setCurrentSection(section.key)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {section.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[600px]">
                    <div className="pr-4">
                      {/* Header Editor */}
                      {currentSection === 'header' && (
                        <HeaderEditor
                          config={config.header}
                          onChange={(updates) => updateSection('header', updates)}
                        />
                      )}

                      {/* Hero Editor */}
                      {currentSection === 'hero' && (
                        <HeroEditor
                          config={config.hero}
                          onChange={(updates) => updateSection('hero', updates)}
                        />
                      )}

                      {/* About Editor */}
                      {currentSection === 'about' && (
                        <AboutEditor
                          config={config.about}
                          onChange={(updates) => updateSection('about', updates)}
                        />
                      )}

                      {/* Products Editor */}
                      {currentSection === 'products' && (
                        <ProductsEditor
                          config={config.products}
                          onChange={(updates) => updateSection('products', updates)}
                        />
                      )}

                      {/* Experience Editor */}
                      {currentSection === 'experience' && (
                        <ExperienceEditor
                          config={config.experience}
                          onChange={(updates) => updateSection('experience', updates)}
                        />
                      )}

                      {/* Contact Editor */}
                      {currentSection === 'contact' && (
                        <ContactEditor
                          config={config.contact}
                          onChange={(updates) => updateSection('contact', updates)}
                        />
                      )}

                      {/* Footer Editor */}
                      {currentSection === 'footer' && (
                        <FooterEditor
                          config={config.footer}
                          onChange={(updates) => updateSection('footer', updates)}
                        />
                      )}

                      {/* Meta Editor (futuro) */}
                      {currentSection === 'meta' && (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                              Editor de Meta Tags será implementado em breve
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="col-span-8">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Preview Controls */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Preview</h2>

                    <div className="flex gap-2">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={previewMode === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>

                      <Separator orientation="vertical" className="h-8" />

                      <Button variant="outline" size="sm" onClick={togglePreview}>
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Preview Content */}
                  {showPreview ? (
                    <div
                      className={`
                        mx-auto border rounded-lg overflow-hidden bg-white transition-all
                        ${previewMode === 'mobile' ? 'max-w-[375px]' : ''}
                        ${previewMode === 'tablet' ? 'max-w-[768px]' : ''}
                        ${previewMode === 'desktop' ? 'w-full' : ''}
                      `}
                    >
                      <div className="aspect-[16/10] bg-muted flex items-center justify-center">
                        <div className="text-center p-8">
                          <p className="text-muted-foreground mb-4">
                            Preview da Landing Page
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Seção atual: <strong>{currentSection}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            O preview em tempo real será implementado integrando com os componentes
                            da landing page
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Preview oculto</p>
                    </div>
                  )}

                  {/* Preview Info */}
                  <div className="text-xs text-muted-foreground text-center">
                    Modo: {previewMode} • Última modificação:{' '}
                    {new Date(config.lastModified).toLocaleString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-6 text-xs text-muted-foreground">
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl+S</kbd> Salvar
              </div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl+E</kbd> Exportar
              </div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl+P</kbd> Toggle Preview
              </div>
              <div>
                <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+R</kbd> Restaurar
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={setFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelect}
      />
    </AdminLayout>
  );
};

export default AdminLandingPageEditor;
