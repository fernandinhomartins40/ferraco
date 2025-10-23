import { useState, useEffect } from "react";
import { X, User, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { partialLeadService } from "@/services/partialLeadService";
import { publicLeadService } from "@/services/publicLeadService";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeadModal = ({ isOpen, onClose }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Debounce dos dados do formulário para captura silenciosa
  const debouncedFormData = useDebounce(formData, 800); // 800ms de delay

  // Capturar dados silenciosamente conforme o usuário digita
  useEffect(() => {
    // Só capturar se o modal estiver aberto e houver dados
    if (isOpen && (debouncedFormData.name.trim() || debouncedFormData.phone.trim())) {
      partialLeadService.captureFormData(
        debouncedFormData.name,
        debouncedFormData.phone,
        'modal-orcamento',
        window.location.href
      );
    }
  }, [debouncedFormData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Criar lead no backend (PostgreSQL)
      await publicLeadService.create({
        name: formData.name,
        phone: formData.phone,
        source: 'modal-orcamento',
      });

      // 2. Salvar também no localStorage como fallback/cache
      const { leadStorage } = await import('@/utils/leadStorage');
      leadStorage.addLead(formData.name, formData.phone, 'modal-orcamento');

      // 3. Marcar lead parcial como convertido
      await partialLeadService.markAsConverted('modal-orcamento');

      toast({
        title: "Sucesso!",
        description: "Seus dados foram enviados. Nossa equipe entrará em contato em breve.",
        variant: "default"
      });

      // Reset form and close modal
      setFormData({ name: "", phone: "" });
      onClose();
    } catch (error: any) {
      // Se falhar a API, tentar salvar apenas no localStorage
      try {
        const { leadStorage } = await import('@/utils/leadStorage');
        leadStorage.addLead(formData.name, formData.phone, 'modal-orcamento');

        await partialLeadService.markAsConverted('modal-orcamento');

        toast({
          title: "Dados salvos localmente",
          description: "Seus dados foram salvos. Enviaremos quando possível.",
          variant: "default"
        });

        setFormData({ name: "", phone: "" });
        onClose();
      } catch (fallbackError) {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao enviar seus dados. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Solicitar Orçamento
          </h2>
          <p className="text-muted-foreground">
            Deixe seus dados e nossa equipe entrará em contato em até 2 horas úteis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome Completo *
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="Digite seu nome completo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Telefone *
            </Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="flex items-start">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 mt-2 flex-shrink-0"></span>
              Orçamento grátis e sem compromisso
            </p>
            <p className="flex items-start mt-1">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 mt-2 flex-shrink-0"></span>
              Resposta em até 2 horas úteis
            </p>
            <p className="flex items-start mt-1">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 mt-2 flex-shrink-0"></span>
              Atendimento técnico especializado
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full font-semibold transition-smooth hover:scale-105"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Enviando..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Solicitar Orçamento Grátis
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Seus dados estão seguros e não serão compartilhados com terceiros
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;