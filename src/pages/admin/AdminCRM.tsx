import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import CRMPipeline from "@/components/admin/CRMPipeline";

const AdminCRM = () => {
  return (
    <>
      <Helmet>
        <title>CRM e Pipeline - Ferraco CRM</title>
        <meta name="description" content="Sistema completo de CRM com funil visual, gestão de oportunidades e lead scoring" />
      </Helmet>
      <AdminLayout>
        <CRMPipeline />
      </AdminLayout>
    </>
  );
};

export default AdminCRM;