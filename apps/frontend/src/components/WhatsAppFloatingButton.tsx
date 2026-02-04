import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppFloatingButtonProps {
  onClick: () => void;
}

const WhatsAppFloatingButton = ({ onClick }: WhatsAppFloatingButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center group"
      size="icon"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />

      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
    </Button>
  );
};

export default WhatsAppFloatingButton;
