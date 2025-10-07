import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAIData() {
  console.log('🌱 Iniciando seed de dados da IA...');

  // 1. Dados da Empresa
  console.log('📍 Criando dados da empresa...');
  await prisma.companyData.deleteMany();
  await prisma.companyData.create({
    data: {
      name: 'Ferraco - Estruturas Metálicas',
      industry: 'Serralheria e Metalurgia',
      description: 'Especializada em estruturas metálicas, serralheria, soldas e construção civil. Atendemos projetos residenciais, comerciais e industriais com excelência e qualidade.',
      differentials: JSON.stringify([
        'Mais de 15 anos de experiência no mercado',
        'Equipe técnica altamente qualificada',
        'Materiais de primeira qualidade',
        'Garantia de todos os serviços executados',
        'Atendimento personalizado e consultoria técnica'
      ]),
      targetAudience: 'Construtoras, empresas, residências e condomínios',
      location: 'São Paulo, SP - Atendemos toda a Grande São Paulo',
      workingHours: 'Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h',
      phone: '(11) 3456-7890',
      website: 'https://ferraco.com.br'
    }
  });

  // 2. Produtos
  console.log('🛠️  Criando produtos...');
  await prisma.product.deleteMany();

  const products = [
    {
      name: 'Portão de Ferro de Correr',
      description: 'Portão de ferro robusto com sistema de trilho. Ideal para garagens residenciais e comerciais. Diversos modelos e acabamentos disponíveis.',
      category: 'Portões',
      price: 1200.00,
      keywords: JSON.stringify(['portão', 'ferro', 'correr', 'garagem', 'entrada', 'portao'])
    },
    {
      name: 'Portão Basculante',
      description: 'Portão basculante automático ou manual. Seguro, prático e durável. Pintura eletrostática de alta qualidade.',
      category: 'Portões',
      price: 1800.00,
      keywords: JSON.stringify(['portão', 'basculante', 'automático', 'garagem', 'portao'])
    },
    {
      name: 'Guarda-Corpo de Inox',
      description: 'Guarda-corpo em aço inox 304. Moderno, elegante e durável. Ideal para escadas, sacadas e mezaninos.',
      category: 'Guarda-Corpo',
      price: 450.00, // por metro
      keywords: JSON.stringify(['guarda-corpo', 'guarda corpo', 'inox', 'escada', 'sacada', 'proteção', 'protecao'])
    },
    {
      name: 'Estrutura Metálica para Galpão',
      description: 'Projeto completo de estrutura metálica para galpões industriais e comerciais. Cálculo estrutural incluso. Atende normas técnicas.',
      category: 'Estruturas',
      price: null, // sob orçamento
      keywords: JSON.stringify(['estrutura', 'metálica', 'metalica', 'galpão', 'galpao', 'industrial', 'cobertura'])
    },
    {
      name: 'Escada de Ferro',
      description: 'Escadas retas, em caracol ou em L. Ferro maciço ou misto (ferro + madeira). Projeto personalizado sob medida.',
      category: 'Escadas',
      price: null, // sob orçamento
      keywords: JSON.stringify(['escada', 'ferro', 'caracol', 'reta', 'mezanino', 'madeira'])
    },
    {
      name: 'Porta de Ferro',
      description: 'Portas de ferro sob medida para segurança residencial e comercial. Diversos modelos: maciça, com vidro, basculante. Pintura em diversas cores.',
      category: 'Portas',
      price: 800.00,
      keywords: JSON.stringify(['porta', 'ferro', 'segurança', 'seguranca', 'entrada', 'vidro'])
    },
    {
      name: 'Grade de Proteção',
      description: 'Grades de segurança para janelas e portas. Aço galvanizado ou ferro pintado. Instalação profissional inclusa.',
      category: 'Grades',
      price: 180.00, // por m²
      keywords: JSON.stringify(['grade', 'proteção', 'protecao', 'janela', 'segurança', 'seguranca'])
    },
    {
      name: 'Cobertura Metálica',
      description: 'Coberturas em estrutura metálica com telha galvanizada, telha sanduíche ou policarbonato. Projetos personalizados.',
      category: 'Coberturas',
      price: null, // sob orçamento
      keywords: JSON.stringify(['cobertura', 'telha', 'garagem', 'área externa', 'area externa', 'policarbonato'])
    },
    {
      name: 'Serralheria Industrial',
      description: 'Serviços de serralheria para indústrias: manutenção de equipamentos, fabricação de peças sob medida, soldas especiais.',
      category: 'Industrial',
      price: null,
      keywords: JSON.stringify(['industrial', 'serralheria', 'solda', 'manutenção', 'manutencao', 'fabrica'])
    },
    {
      name: 'Corrimão de Inox',
      description: 'Corrimãos em aço inox para escadas e rampas. Modelos retos ou curvos. Acabamento polido ou escovado.',
      category: 'Guarda-Corpo',
      price: 320.00, // por metro
      keywords: JSON.stringify(['corrimão', 'corrimao', 'inox', 'escada', 'rampa', 'acessibilidade'])
    }
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  // 3. FAQs
  console.log('❓ Criando FAQs...');
  await prisma.fAQItem.deleteMany();

  const faqs = [
    {
      question: 'Qual é o prazo de entrega?',
      answer: 'O prazo varia de acordo com o projeto e complexidade. Em média: portões e portas (15-20 dias úteis), estruturas maiores (30-60 dias). Fazemos orçamento com prazo específico para cada caso.',
      category: 'Prazos',
      keywords: JSON.stringify(['prazo', 'entrega', 'quanto tempo', 'demora', 'dias'])
    },
    {
      question: 'Fazem instalação?',
      answer: 'Sim! Todos os nossos produtos incluem instalação feita por profissionais qualificados e experientes. A instalação já está incluída no preço do orçamento.',
      category: 'Serviços',
      keywords: JSON.stringify(['instalação', 'instalacao', 'montagem', 'instalar', 'montar'])
    },
    {
      question: 'Atendem fora de São Paulo?',
      answer: 'Atendemos toda a Grande São Paulo sem custo adicional. Para outras regiões do interior ou litoral, consulte disponibilidade e valores pelo telefone (11) 3456-7890.',
      category: 'Atendimento',
      keywords: JSON.stringify(['região', 'regiao', 'atendimento', 'localização', 'localizacao', 'onde', 'cidade'])
    },
    {
      question: 'Como funciona o orçamento?',
      answer: 'É simples! Faça contato pelo WhatsApp ou telefone. Enviamos um técnico para avaliar o local (sem custo). Em até 48 horas enviamos o orçamento detalhado por escrito.',
      category: 'Orçamento',
      keywords: JSON.stringify(['orçamento', 'orcamento', 'preço', 'preco', 'valor', 'quanto custa'])
    },
    {
      question: 'Qual a garantia dos produtos?',
      answer: 'Todos os produtos têm garantia de 12 meses contra defeitos de fabricação e instalação. Serviços de solda e pintura também possuem garantia. Emitimos certificado de garantia.',
      category: 'Garantia',
      keywords: JSON.stringify(['garantia', 'defeito', 'problema', 'conserto'])
    },
    {
      question: 'Aceitam cartão de crédito?',
      answer: 'Sim! Aceitamos cartão de crédito em até 12x, PIX com 5% de desconto, boleto bancário e transferência. Também trabalhamos com cheque para clientes antigos.',
      category: 'Pagamento',
      keywords: JSON.stringify(['pagamento', 'cartão', 'cartao', 'pix', 'boleto', 'parcela', 'parcelamento'])
    },
    {
      question: 'Fazem projeto personalizado?',
      answer: 'Sim! Todos os nossos projetos podem ser personalizados de acordo com sua necessidade. Trabalhamos com desenhos fornecidos pelo cliente ou criamos do zero.',
      category: 'Projetos',
      keywords: JSON.stringify(['projeto', 'personalizado', 'sob medida', 'customizado', 'desenho'])
    },
    {
      question: 'Qual o valor mínimo de serviço?',
      answer: 'Não temos valor mínimo! Atendemos desde pequenos reparos até grandes projetos industriais. Entre em contato e faremos um orçamento sem compromisso.',
      category: 'Orçamento',
      keywords: JSON.stringify(['valor mínimo', 'minimo', 'pequeno serviço', 'pequeno', 'reparo'])
    }
  ];

  for (const faq of faqs) {
    await prisma.fAQItem.create({ data: faq });
  }

  console.log('✅ Seed de IA concluído com sucesso!');
  console.log(`   - 1 empresa cadastrada`);
  console.log(`   - ${products.length} produtos cadastrados`);
  console.log(`   - ${faqs.length} FAQs cadastradas`);
  console.log('');
  console.log('🎯 Próximos passos:');
  console.log('   1. Instale o Ollama: https://ollama.com/download');
  console.log('   2. Baixe o modelo: ollama pull phi3:mini');
  console.log('   3. Inicie o backend: npm run dev');
  console.log('   4. Teste o chatbot!');
}

seedAIData()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
