import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import SimpleUserManagement from "@/components/admin/SimpleUserManagement";

const AdminUsers = () => {
  return (
    <>
      <Helmet>
        <title>Gestão de Usuários - Ferraco CRM</title>
        <meta name="description" content="Gerencie usuários, perfis de acesso, equipes, permissões e auditoria do sistema" />
      </Helmet>
      <AdminLayout>
        <SimpleUserManagement />
      </AdminLayout>
    </>
  );
};

export default AdminUsers;