import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import SecurityDashboard from "@/components/admin/SecurityDashboard";

const AdminSecurity = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard de Segurança - Ferraco CRM</title>
        <meta name="description" content="Monitoramento de segurança, logs de acesso e métricas de proteção do sistema" />
      </Helmet>
      <AdminLayout>
        <SecurityDashboard />
      </AdminLayout>
    </>
  );
};

export default AdminSecurity;