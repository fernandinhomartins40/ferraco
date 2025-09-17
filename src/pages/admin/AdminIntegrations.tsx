import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import ExternalIntegrations from "@/components/admin/ExternalIntegrations";

const AdminIntegrations = () => {
  return (
    <>
      <Helmet>
        <title>Integrações Externas - Ferraco CRM</title>
        <meta name="description" content="Conecte com Zapier, Google Analytics, Facebook Ads, CRMs externos e ferramentas de email marketing" />
      </Helmet>
      <AdminLayout>
        <ExternalIntegrations />
      </AdminLayout>
    </>
  );
};

export default AdminIntegrations;