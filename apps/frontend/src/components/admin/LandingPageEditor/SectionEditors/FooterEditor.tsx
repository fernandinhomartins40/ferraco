/**
 * FooterEditor - Editor simplificado do rodapé
 * Organizado em abas: Logo, Textos, Contatos e Redes Sociais
 */

import { FooterConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const updateBottomLink = (index: number, field: 'text' | 'href', value: string) => {
    if (!config.bottom.links) return;
    const newLinks = [...config.bottom.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange({
      bottom: {
        ...config.bottom,
        links: newLinks,
      },
    });
  };

  const addBottomLink = () => {
    const newLink = {
      id: `bottom-link-${Date.now()}`,
      text: 'Novo Link',
      href: '#',
    };
    onChange({
      bottom: {
        ...config.bottom,
        links: [...(config.bottom.links || []), newLink],
      },
    });
  };

  const removeBottomLink = (index: number) => {
    if (!config.bottom.links) return;
    const newLinks = config.bottom.links.filter((_, i) => i !== index);
    onChange({
      bottom: {
        ...config.bottom,
        links: newLinks,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logo">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="textos">Textos</TabsTrigger>
          <TabsTrigger value="info-contato">Info Contato</TabsTrigger>
          <TabsTrigger value="contatos">Links</TabsTrigger>
          <TabsTrigger value="sociais">Redes Sociais</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        {/* Aba Logo */}
        <TabsContent value="logo" className="space-y-6 mt-4">
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
        </TabsContent>

        {/* Aba Textos */}
        <TabsContent value="textos" className="space-y-6 mt-4">
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
        </TabsContent>

        {/* Aba Informações de Contato */}
        <TabsContent value="info-contato" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>Endereço, telefone e e-mail que aparecem abaixo do logo no rodapé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input
                  value={config.contactInfo?.address || ''}
                  onChange={(e) =>
                    onChange({
                      contactInfo: {
                        ...config.contactInfo,
                        address: e.target.value,
                      },
                    })
                  }
                  placeholder="Rua Industrial, 1234 - São Paulo - SP, 01234-567"
                />
                <p className="text-xs text-muted-foreground">
                  Endereço completo com rua, número, bairro, cidade, estado e CEP
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Telefones</Label>
                <Input
                  value={config.contactInfo?.phone || ''}
                  onChange={(e) =>
                    onChange({
                      contactInfo: {
                        ...config.contactInfo,
                        phone: e.target.value,
                      },
                    })
                  }
                  placeholder="(11) 3456-7890 | (11) 98765-4321"
                />
                <p className="text-xs text-muted-foreground">
                  Telefone(s) de contato. Você pode adicionar múltiplos separados por |
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={config.contactInfo?.email || ''}
                  onChange={(e) =>
                    onChange({
                      contactInfo: {
                        ...config.contactInfo,
                        email: e.target.value,
                      },
                    })
                  }
                  placeholder="contato@ferraco.com.br"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  E-mail principal para contato
                </p>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">📍 Prévia das informações:</p>
                {config.contactInfo?.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📍</span>
                    <span>{config.contactInfo.address}</span>
                  </div>
                )}
                {config.contactInfo?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📞</span>
                    <span>{config.contactInfo.phone}</span>
                  </div>
                )}
                {config.contactInfo?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📧</span>
                    <span>{config.contactInfo.email}</span>
                  </div>
                )}
                {!config.contactInfo?.address && !config.contactInfo?.phone && !config.contactInfo?.email && (
                  <p className="text-xs text-muted-foreground italic">Nenhuma informação de contato configurada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Links (anteriormente Contatos) */}
        <TabsContent value="contatos" className="space-y-6 mt-4">
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
        </TabsContent>

        {/* Aba Redes Sociais */}
        <TabsContent value="sociais" className="space-y-6 mt-4">
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
        </TabsContent>

        {/* Aba Configurações */}
        <TabsContent value="config" className="space-y-6 mt-4">
          {/* Layout do Rodapé */}
          <Card>
            <CardHeader>
              <CardTitle>Layout do Rodapé</CardTitle>
              <CardDescription>Escolha o estilo de layout do rodapé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Layout</Label>
                <Select
                  value={config.layout}
                  onValueChange={(value: 'simple' | 'columns' | 'mega') =>
                    onChange({ layout: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="columns">Colunas</SelectItem>
                    <SelectItem value="mega">Mega Footer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {config.layout === 'simple' && 'Layout compacto com informações centralizadas'}
                  {config.layout === 'columns' && 'Layout com múltiplas colunas de informação'}
                  {config.layout === 'mega' && 'Layout expandido com mais espaço e recursos'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Newsletter */}
          {config.newsletter && (
            <Card>
              <CardHeader>
                <CardTitle>Newsletter</CardTitle>
                <CardDescription>Configure a inscrição de newsletter no rodapé</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exibir Newsletter</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mostra/oculta o formulário de newsletter
                    </p>
                  </div>
                  <Switch
                    checked={config.newsletter.enabled}
                    onCheckedChange={(enabled) =>
                      onChange({
                        newsletter: { ...config.newsletter, enabled },
                      })
                    }
                  />
                </div>

                {config.newsletter.enabled && (
                  <>
                    <Separator />

                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={config.newsletter.title}
                        onChange={(e) =>
                          onChange({
                            newsletter: { ...config.newsletter, title: e.target.value },
                          })
                        }
                        placeholder="Assine nossa Newsletter"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        value={config.newsletter.description || ''}
                        onChange={(e) =>
                          onChange({
                            newsletter: { ...config.newsletter, description: e.target.value },
                          })
                        }
                        placeholder="Receba nossas novidades e ofertas exclusivas"
                        rows={2}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Placeholder do Input</Label>
                      <Input
                        value={config.newsletter.placeholder}
                        onChange={(e) =>
                          onChange({
                            newsletter: { ...config.newsletter, placeholder: e.target.value },
                          })
                        }
                        placeholder="Digite seu e-mail"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input
                        value={config.newsletter.buttonText}
                        onChange={(e) =>
                          onChange({
                            newsletter: { ...config.newsletter, buttonText: e.target.value },
                          })
                        }
                        placeholder="Inscrever"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Links Inferiores (Bottom Links) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Links Inferiores</CardTitle>
                  <CardDescription>Links adicionais no final do rodapé (Termos, Privacidade, etc)</CardDescription>
                </div>
                <Button onClick={addBottomLink} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.bottom.links && config.bottom.links.length > 0 ? (
                <div className="space-y-3">
                  {config.bottom.links.map((link, index) => (
                    <Card key={link.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Texto</Label>
                            <Input
                              value={link.text}
                              onChange={(e) => updateBottomLink(index, 'text', e.target.value)}
                              placeholder="Política de Privacidade"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Link (href)</Label>
                            <Input
                              value={link.href}
                              onChange={(e) => updateBottomLink(index, 'href', e.target.value)}
                              placeholder="/privacidade"
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBottomLink(index)}
                          className="text-destructive hover:text-destructive mt-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">Nenhum link inferior configurado</p>
                  <p className="text-xs mt-1">Clique em "Adicionar Link" para criar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
