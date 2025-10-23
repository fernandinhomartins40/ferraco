/**
 * ProductsEditor - Editor da seção de Produtos
 */

import { ProductsConfig, ProductItem, ProductBenefit } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker, FontSelector, ImageUploader, IconSelector, ArrayEditor } from '../StyleControls';
import { Separator } from '@/components/ui/separator';
import { generateUUID } from '@/utils/uuid';

interface ProductsEditorProps {
  config: ProductsConfig;
  onChange: (config: Partial<ProductsConfig>) => void;
}

export const ProductsEditor = ({ config, onChange }: ProductsEditorProps) => {
  const updateTitle = (updates: Partial<ProductsConfig['title']>) => {
    onChange({ title: { ...config.title, ...updates } });
  };

  const updateSubtitle = (updates: Partial<ProductsConfig['subtitle']>) => {
    onChange({ subtitle: config.subtitle ? { ...config.subtitle, ...updates } : undefined });
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Seção Ativa</Label>
            <Switch checked={config.enabled} onCheckedChange={(enabled) => onChange({ enabled })} />
          </div>

          <div className="space-y-2">
            <Label>Título da Seção</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle({ text: e.target.value })}
              placeholder="Nossos Produtos"
            />
          </div>

          {config.subtitle && (
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={config.subtitle.text}
                onChange={(e) => updateSubtitle({ text: e.target.value })}
                placeholder="Soluções completas"
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={config.layout} onValueChange={(layout: any) => onChange({ layout })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grade</SelectItem>
                <SelectItem value="carousel">Carrossel</SelectItem>
                <SelectItem value="masonry">Alvenaria</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Colunas (Desktop)</Label>
            <Select
              value={String(config.columns.desktop || 3)}
              onValueChange={(val) =>
                onChange({ columns: { ...config.columns, desktop: Number(val) } })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 coluna</SelectItem>
                <SelectItem value="2">2 colunas</SelectItem>
                <SelectItem value="3">3 colunas</SelectItem>
                <SelectItem value="4">4 colunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Gerencie os produtos exibidos</CardDescription>
        </CardHeader>
        <CardContent>
          <ArrayEditor
            label="Lista de Produtos"
            items={config.products}
            onChange={(products) => onChange({ products })}
            getItemLabel={(item) => item.name}
            createNew={() =>
              ({
                id: generateUUID(),
                name: 'Novo Produto',
                description: 'Descrição do produto',
                shortDescription: 'Descrição curta',
                image: { url: '', alt: 'Produto' },
                benefits: [],
              } as ProductItem)
            }
            renderItem={(item, _, updateItem) => (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Produto</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem({ name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem({ description: e.target.value })}
                    rows={3}
                  />
                </div>

                <ImageUploader
                  label="Imagem do Produto"
                  value={item.image}
                  onChange={(image) => updateItem({ image })}
                  enableCrop={true}
                  cropAspectRatio={4 / 3}
                  cropTargetWidth={800}
                  cropTargetHeight={600}
                  cropTitle="Recortar Imagem do Produto"
                  description="Imagens dos produtos serão recortadas em 800x600px (4:3)"
                />

                <IconSelector
                  label="Ícone do Produto (canto superior direito)"
                  value={item.icon || 'Package'}
                  onChange={(icon) => updateItem({ icon })}
                />

                <Separator />

                <div className="space-y-2">
                  <Label>Texto do Botão (opcional)</Label>
                  <Input
                    value={item.cta?.text || ''}
                    onChange={(e) => updateItem({ cta: { ...item.cta, text: e.target.value, href: item.cta?.href || '' } })}
                    placeholder="Quero Saber Mais"
                  />
                </div>

                <Separator />

                <ArrayEditor
                  label="Benefícios"
                  items={item.benefits}
                  onChange={(benefits) => updateItem({ benefits })}
                  getItemLabel={(benefit) => benefit.text}
                  createNew={() =>
                    ({
                      id: generateUUID(),
                      text: 'Novo benefício',
                      icon: 'Check',
                    } as ProductBenefit)
                  }
                  renderItem={(benefit, _, updateBenefit) => (
                    <div className="space-y-4">
                      <Input
                        value={benefit.text}
                        onChange={(e) => updateBenefit({ text: e.target.value })}
                        placeholder="Texto do benefício"
                      />
                      <IconSelector
                        label="Ícone"
                        value={benefit.icon || 'Check'}
                        onChange={(icon) => updateBenefit({ icon })}
                      />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seção de Call-to-Action</CardTitle>
          <CardDescription>Chamada para ação no final da seção de produtos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Exibir CTA</Label>
            <Switch
              checked={config.ctaSection?.enabled !== false}
              onCheckedChange={(enabled) =>
                onChange({
                  ctaSection: {
                    enabled,
                    title: config.ctaSection?.title || 'Não encontrou o que procura?',
                    description: config.ctaSection?.description || 'Nossa equipe técnica desenvolve soluções personalizadas',
                    button: config.ctaSection?.button || { text: 'Solicitar Projeto Personalizado' },
                  },
                })
              }
            />
          </div>

          {config.ctaSection?.enabled !== false && (
            <>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={config.ctaSection?.title || ''}
                  onChange={(e) =>
                    onChange({
                      ctaSection: { ...config.ctaSection!, title: e.target.value },
                    })
                  }
                  placeholder="Não encontrou o que procura?"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={config.ctaSection?.description || ''}
                  onChange={(e) =>
                    onChange({
                      ctaSection: { ...config.ctaSection!, description: e.target.value },
                    })
                  }
                  placeholder="Nossa equipe técnica desenvolve soluções personalizadas"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input
                  value={config.ctaSection?.button?.text || ''}
                  onChange={(e) =>
                    onChange({
                      ctaSection: {
                        ...config.ctaSection!,
                        button: { ...config.ctaSection!.button, text: e.target.value },
                      },
                    })
                  }
                  placeholder="Solicitar Projeto Personalizado"
                />
              </div>

              <div className="space-y-2">
                <Label>Link do Botão (opcional)</Label>
                <Input
                  value={config.ctaSection?.button?.href || ''}
                  onChange={(e) =>
                    onChange({
                      ctaSection: {
                        ...config.ctaSection!,
                        button: { ...config.ctaSection!.button, href: e.target.value },
                      },
                    })
                  }
                  placeholder="#contato ou URL externa"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estilos */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FontSelector
            label="Tamanho do Título"
            value={config.title.style.fontSize || '2.25rem'}
            onChange={(fontSize) => updateTitle({ style: { ...config.title.style, fontSize } })}
            type="size"
          />

          <ColorPicker
            label="Cor do Título"
            value={config.title.style.textColor || '#000000'}
            onChange={(textColor) => updateTitle({ style: { ...config.title.style, textColor } })}
          />

          <ColorPicker
            label="Cor de Fundo da Seção"
            value={config.style.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) =>
              onChange({ style: { ...config.style, backgroundColor } })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
