import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import AIAnalytics from "@/components/admin/AIAnalytics";

const AdminAI = () => {
  return (
    <>
      <Helmet>
        <title>IA e Análises Preditivas - Ferraco CRM</title>
        <meta name="description" content="Sistema de inteligência artificial para análise de sentimento, previsão de conversão e recomendações automáticas" />
      </Helmet>
      <AdminLayout>
        <AIAnalytics />
      </AdminLayout>
    </>
  );
};

export default AdminAI;