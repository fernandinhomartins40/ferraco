/**
 * FooterEditor - Editor simplificado do rodapé
 * Apenas logo, textos, contatos e redes sociais
 */

import { FooterConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ImageUploader, IconSelector } from '../StyleControls';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FooterEditorProps {
  config: FooterConfig;
  onChange: (config: Partial<FooterConfig>) => void;
}

// Tipos de link pré-definidos
const LINK_TYPES = [
  { value: 'email', label: 'E-mail', icon: 'Mail', placeholder: 'contato@empresa.com', hrefTemplate: 'mailto:' },
  { value: 'phone', label: 'Telefone', icon: 'Phone', placeholder: '(11) 1234-5678', hrefTemplate: 'tel:' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', placeholder: '11987654321', hrefTemplate: 'https://wa.me/' },
  { value: 'address', label: 'Endereço', icon: 'MapPin', placeholder: 'Rua Exemplo, 123', hrefTemplate: 'https://maps.google.com/?q=' },
  { value: 'website', label: 'Site/URL', icon: 'Globe', placeholder: 'https://exemplo.com', hrefTemplate: '' },
  { value: 'custom', label: 'Personalizado', icon: 'Link', placeholder: 'Texto livre', hrefTemplate: '' },
] as const;

export const FooterEditor = ({ config, onChange }: FooterEditorProps) => {
  const updateLogo = (updates: Partial<FooterConfig['logo']>) => {
    onChange({ logo: config.logo ? { ...config.logo, ...updates } : undefined });
  };

  // Gera href automaticamente baseado no tipo
  const generateHref = (linkType: string, text: string): string => {
    const type = LINK_TYPES.find(t => t.value === linkType);
    if (!type || linkType === 'custom') return text;

    // Remove formatação para gerar href limpo
    const cleanText = text.replace(/\D/g, ''); // Remove não-dígitos para telefone/whatsapp

    switch (linkType) {
      case 'email':
        return `mailto:${text}`;
      case 'phone':
        return `tel:+55${cleanText}`;
      case 'whatsapp':
        return `https://wa.me/55${cleanText}`;
      case 'address':
        return `https://maps.google.com/?q=${encodeURIComponent(text)}`;
      case 'website':
        return text.startsWith('http') ? text : `https://${text}`;
      default:
        return text;
    }
  };

  const updateSocial = (index: number, field: 'href' | 'label', value: string) => {
    if (!config.social) return;
    const newLinks = [...config.social.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange({
      social: {
        ...config.social,
        links: newLinks,
      },
    });
  };

  const toggleSocialLink = (index: number, enabled: boolean) => {
    if (!config.social) return;
    const newLinks = [...config.social.links];
    // Marca como desabilitado adicionando um campo custom
    newLinks[index] = { ...newLinks[index], href: enabled ? newLinks[index].href || '#' : '' };
    onChange({
      social: {
        ...config.social,
        links: newLinks,
      },
    });
  };

  const updateSection = (sectionIndex: number, field: 'title', value: string) => {
    const newSections = [...config.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
    onChange({ sections: newSections });
  };

  const updateSectionLink = (sectionIndex: number, linkIndex: number, field: 'text' | 'href' | 'linkType' | 'icon', value: string) => {
    const newSections = [...config.sections];
    const newLinks = [...newSections[sectionIndex].links];
    const currentLink = newLinks[linkIndex];

    if (field === 'linkType') {
      // Quando muda o tipo, atualiza o ícone padrão e gera novo href
      const linkTypeConfig = LINK_TYPES.find(t => t.value === value);
      newLinks[linkIndex] = {
        ...currentLink,
        linkType: value as any,
        icon: linkTypeConfig?.icon,
        href: generateHref(value, currentLink.text),
      };
    } else if (field === 'text') {
      // Quando muda o texto e tem linkType, regenera href
      const newText = value;
      const newHref = currentLink.linkType ? generateHref(currentLink.linkType, newText) : currentLink.href;
      newLinks[linkIndex] = {
        ...currentLink,
        text: newText,
        href: newHref,
      };
    } else {
      newLinks[linkIndex] = { ...currentLink, [field]: value };
    }

    newSections[sectionIndex] = { ...newSections[sectionIndex], links: newLinks };
    onChange({ sections: newSections });
  };

  const addSectionLink = (sectionIndex: number) => {
    const newSections = [...config.sections];
    const sectionTitle = newSections[sectionIndex].title;

    // Detecta tipo baseado no título da seção
    let defaultType: any = 'custom';
    if (sectionTitle.toLowerCase().includes('contato')) {
      defaultType = 'email';
    } else if (sectionTitle.toLowerCase().includes('horário')) {
      defaultType = 'custom';
    }

    const linkTypeConfig = LINK_TYPES.find(t => t.value === defaultType);

    const newLink = {
      id: `link-${Date.now()}`,
      text: '',
      href: '',
      linkType: defaultType,
      icon: linkTypeConfig?.icon || 'Link',
    };
    newSections[sectionIndex].links.push(newLink);
    onChange({ sections: newSections });
  };

  const removeSectionLink = (sectionIndex: number, linkIndex: number) => {
    const newSections = [...config.sections];
    newSections[sectionIndex].links = newSections[sectionIndex].links.filter((_, i) => i !== linkIndex);
    onChange({ sections: newSections });
  };

  return (
    <div className="space-y-6">
      {/* Logo do Rodapé */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo do Rodapé</CardTitle>
          <CardDescription>Altere a imagem do logo no rodapé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.logo && config.logo.type === 'image' && config.logo.image && (
            <ImageUploader
              label="Imagem do Logo"
              value={config.logo.image}
              onChange={(image) => updateLogo({ image })}
              description="Logo que aparece no rodapé (pode ser igual ou diferente do cabeçalho)"
            />
          )}
        </CardContent>
      </Card>

      {/* Textos do Rodapé */}
      <Card>
        <CardHeader>
          <CardTitle>Textos do Rodapé</CardTitle>
          <CardDescription>Edite o tagline e copyright</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tagline/Slogan</Label>
            <Input
              value={config.tagline || ''}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="Ex: Equipamentos de qualidade para pecuária leiteira"
            />
            <p className="text-xs text-muted-foreground">
              Frase curta que aparece abaixo do logo
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Copyright</Label>
            <Input
              value={config.bottom.copyright}
              onChange={(e) =>
                onChange({
                  bottom: { ...config.bottom, copyright: e.target.value },
                })
              }
              placeholder="© 2024 Ferraco. Todos os direitos reservados."
            />
            <p className="text-xs text-muted-foreground">
              Texto de copyright que aparece no final do rodapé
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Contato e Horário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Contato</CardTitle>
          <CardDescription>Edite informações de contato que aparecem no rodapé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.sections.map((section, sectionIndex) => (
            <div key={section.id} className="space-y-3">
              <div className="space-y-2">
                <Label className="font-semibold">Seção: {section.title}</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="Título da seção"
                />
              </div>

              <div className="ml-4 space-y-3 border-l-2 pl-4">
                {section.links.map((link, linkIndex) => {
                  const linkTypeConfig = LINK_TYPES.find(t => t.value === link.linkType) || LINK_TYPES[5];
                  const isCustomType = link.linkType === 'custom' || !link.linkType;

                  return (
                    <Card key={link.id} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-3">
                            {/* Tipo de Link */}
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Tipo de Link</Label>
                              <Select
                                value={link.linkType || 'custom'}
                                onValueChange={(value) => updateSectionLink(sectionIndex, linkIndex, 'linkType', value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {LINK_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Texto */}
                            <div className="space-y-1">
                              <Label className="text-xs">
                                {isCustomType ? 'Texto' : linkTypeConfig.label}
                              </Label>
                              <Input
                                value={link.text}
                                onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'text', e.target.value)}
                                placeholder={linkTypeConfig.placeholder}
                                className="text-sm"
                              />
                              {!isCustomType && (
                                <p className="text-xs text-muted-foreground">
                                  O link será gerado automaticamente
                                </p>
                              )}
                            </div>

                            {/* Href (apenas para custom) */}
                            {isCustomType && (
                              <div className="space-y-1">
                                <Label className="text-xs">Link (href)</Label>
                                <Input
                                  value={link.href}
                                  onChange={(e) => updateSectionLink(sectionIndex, linkIndex, 'href', e.target.value)}
                                  placeholder="#"
                                  className="text-sm"
                                />
                              </div>
                            )}

                            {/* Preview do href gerado */}
                            {!isCustomType && link.text && (
                              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                <strong>Link:</strong> {link.href || '(preencha o campo acima)'}
                              </div>
                            )}

                            {/* Ícone */}
                            <div className="space-y-1">
                              <Label className="text-xs">Ícone (opcional)</Label>
                              <IconSelector
                                label=""
                                value={link.icon || linkTypeConfig.icon}
                                onChange={(icon) => updateSectionLink(sectionIndex, linkIndex, 'icon', icon)}
                              />
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSectionLink(sectionIndex, linkIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSectionLink(sectionIndex)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar {section.title === 'Contato' ? 'Contato' : section.title === 'Horário' ? 'Horário' : 'Item'}
                </Button>
              </div>

              {sectionIndex < config.sections.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      {config.social && (
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>Configure visibilidade e links das redes sociais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Exibir Redes Sociais</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Mostra/oculta a seção de redes sociais no rodapé
                </p>
              </div>
              <Switch
                checked={config.social.enabled}
                onCheckedChange={(enabled) =>
                  onChange({
                    social: { ...config.social, enabled },
                  })
                }
              />
            </div>

            {config.social.enabled && (
              <>
                <Separator />

                {config.social.title !== undefined && (
                  <div className="space-y-2">
                    <Label>Título da Seção</Label>
                    <Input
                      value={config.social.title}
                      onChange={(e) =>
                        onChange({
                          social: { ...config.social, title: e.target.value },
                        })
                      }
                      placeholder="Siga-nos"
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="font-semibold">Links das Redes Sociais</Label>
                  {config.social.links.map((link, index) => (
                    <Card key={link.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {link.platform === 'facebook' ? '📘' :
                                   link.platform === 'instagram' ? '📷' :
                                   link.platform === 'linkedin' ? '💼' :
                                   link.platform === 'twitter' ? '🐦' :
                                   link.platform === 'youtube' ? '📺' : '🔗'}
                                </span>
                                <Label className="font-medium capitalize">{link.platform}</Label>
                              </div>
                              <Switch
                                checked={!!link.href}
                                onCheckedChange={(enabled) => toggleSocialLink(index, enabled)}
                              />
                            </div>

                            {link.href && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-sm">URL do Perfil</Label>
                                  <Input
                                    value={link.href}
                                    onChange={(e) => updateSocial(index, 'href', e.target.value)}
                                    placeholder={`https://${link.platform}.com/seuperfil`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm">Texto do Link (acessibilidade)</Label>
                                  <Input
                                    value={link.label}
                                    onChange={(e) => updateSocial(index, 'label', e.target.value)}
                                    placeholder={`Visite nosso ${link.platform}`}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
