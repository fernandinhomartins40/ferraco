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
  List,
} from 'lucide-react';
import {
  HeaderEditor,
  HeroEditor,
  MarqueeEditor,
  AboutEditor,
  ProductsEditor,
  ExperienceEditor,
  ContactEditor,
  FooterEditor,
} from '@/components/admin/LandingPageEditor/SectionEditors';
import { LandingPagePreview } from '@/components/admin/LandingPageEditor/LandingPagePreview';
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
    { key: 'marquee', label: 'Marquee', icon: List },
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
      <div className="w-full flex flex-col gap-6">
        {/* Header - Mobile Responsivo */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Editor de Landing Page</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Customize o conteúdo e estilo da sua landing page
            </p>
          </div>

          {/* Mobile: Grid 2x2 | Desktop: Flex horizontal */}
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-nowrap md:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="min-h-[44px]"
              title="Restaurar configurações padrão"
            >
              <RotateCcw className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Restaurar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportConfig}
              className="min-h-[44px]"
              title="Exportar configurações"
            >
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Exportar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="min-h-[44px]"
              title="Importar configurações"
            >
              <Upload className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Importar</span>
            </Button>

            <Button
              onClick={save}
              disabled={!isDirty || isSaving}
              size="sm"
              className="min-h-[44px]"
              title="Salvar alterações"
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isSaving ? 'Salvando...' : isDirty ? 'Salvar *' : 'Salvo'}</span>
              <span className="sm:hidden">{isSaving ? '...' : isDirty ? '*' : '✓'}</span>
            </Button>
          </div>
        </div>

        {/* Status */}
        {isDirty && (
          <Alert className="mx-0">
            <AlertDescription className="text-sm">
              Você tem alterações não salvas. <span className="hidden sm:inline">Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd> ou clique em</span><span className="sm:hidden">Clique em</span> Salvar.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          {/* Seções */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base md:text-lg font-semibold mb-3">Seções</h2>
                  {/* Mobile: Scroll horizontal | Desktop: Grid 4 colunas */}
                  <div className="flex overflow-x-auto gap-2 md:grid md:grid-cols-4 scrollbar-hide pb-2 md:pb-0 -mx-1 px-1">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <Button
                          key={section.key}
                          variant={currentSection === section.key ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start shrink-0 min-h-[44px] whitespace-nowrap"
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

                <div>
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

                  {/* Marquee Editor */}
                  {currentSection === 'marquee' && config.marquee && (
                    <MarqueeEditor
                      config={config.marquee}
                      onChange={(updates) => updateSection('marquee', updates)}
                    />
                  )}

                  {currentSection === 'marquee' && !config.marquee && (
                    <Card>
                      <CardContent className="p-4 md:p-6 text-center">
                        <p className="text-sm md:text-base text-muted-foreground mb-4">
                          Configuração de Marquee não encontrada. Clique em "Restaurar Padrões" para adicionar.
                        </p>
                      </CardContent>
                    </Card>
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
                      <CardContent className="p-4 md:p-6 text-center">
                        <p className="text-sm md:text-base text-muted-foreground">
                          Editor de Meta Tags será implementado em breve
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {/* Preview Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base md:text-lg font-semibold">Preview</h2>

                  <div className="flex gap-2 justify-between sm:justify-start flex-wrap">
                    <div className="flex gap-2">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                        className="min-h-[44px] min-w-[44px]"
                        title="Desktop"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={previewMode === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('tablet')}
                        className="min-h-[44px] min-w-[44px]"
                        title="Tablet"
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                        className="min-h-[44px] min-w-[44px]"
                        title="Mobile"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-8 hidden sm:block" />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePreview}
                      className="min-h-[44px] min-w-[44px]"
                      title={showPreview ? "Ocultar Preview" : "Mostrar Preview"}
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Preview Content */}
                {showPreview ? (
                  <div className="w-full border rounded-lg overflow-auto bg-background h-[350px] sm:h-[450px] md:h-[600px]">
                    <LandingPagePreview
                      config={config}
                      currentSection={currentSection}
                      previewMode={previewMode}
                    />
                  </div>
                ) : (
                  <div className="h-[350px] sm:h-[450px] md:h-[600px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Preview oculto</p>
                  </div>
                )}

                {/* Preview Info */}
                <div className="text-xs text-muted-foreground text-center">
                  <span className="hidden sm:inline">Modo: {previewMode} • Última modificação: {new Date(config.lastModified).toLocaleString('pt-BR')}</span>
                  <span className="sm:hidden">{previewMode} • {new Date(config.lastModified).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keyboard Shortcuts Help - Responsivo */}
        <Card className="hidden md:block">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 md:gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] md:text-xs">Ctrl+S</kbd>
                <span>Salvar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] md:text-xs">Ctrl+E</kbd>
                <span>Exportar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] md:text-xs">Ctrl+P</kbd>
                <span>Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] md:text-xs">Ctrl+Shift+R</kbd>
                <span>Restaurar</span>
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
