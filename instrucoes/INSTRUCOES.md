# 💰 Gestão Financeira - Angular 21

Um aplicativo moderno de gestão financeira construído com **Angular 21**, **CSS puro** e **roteamento nativo do Angular**.

## 🎯 Características

- ✅ **Dashboard** - Visão geral de saldo, receitas, despesas e fluxo líquido
- ✅ **Gerenciamento de Contas** - Crie e gerencie suas contas bancárias e de caixa
- ✅ **Registro de Transações** - Registre receitas e despesas com categorias
- ✅ **Contas a Pagar** - Acompanhe suas obrigações financeiras
- ✅ **Contas a Receber** - Gerencie suas receitas esperadas
- ✅ **Fluxo de Caixa** - Análise de entrada e saída de recursos por período
- ✅ **Análise Financeira** - Visualize distribuição de receitas e despesas
- ✅ **Relatórios** - Gere relatórios financeiros
- ✅ **Configurações** - Personalize suas preferências
- ✅ **Armazenamento Local** - Dados persistem no localStorage

## 🚀 Como Usar

### Pré-requisitos
- Node.js 22.13.0 ou superior
- npm 10.9.2 ou superior
- Angular CLI 21.2.3

### Instalação

1. **Navegue até o diretório do projeto:**
```bash
cd /home/ubuntu/gestao-financeira
```

2. **Instale as dependências (se necessário):**
```bash
npm install
```

### Executando o Projeto

1. **Inicie o servidor de desenvolvimento:**
```bash
npm start
```

2. **Acesse a aplicação:**
   - Local: `http://localhost:4200/`
   - Público: `https://4200-isi5s6pf0n0741hd0lg32-0e85b971.us1.manus.computer`

### Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/gestao-financeira/browser/`

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── sidebar.component.ts
│   │   ├── sidebar.component.css
│   │   ├── header.component.ts
│   │   └── header.component.css
│   ├── pages/              # Páginas da aplicação
│   │   ├── dashboard/
│   │   ├── contas/
│   │   ├── transacoes/
│   │   ├── contas-pagar/
│   │   ├── contas-receber/
│   │   ├── fluxo-caixa/
│   │   ├── analise/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── services/           # Serviços de dados
│   │   ├── conta.service.ts
│   │   ├── transacao.service.ts
│   │   ├── conta-pagar.service.ts
│   │   ├── conta-receber.service.ts
│   │   └── usuario.service.ts
│   ├── models/             # Modelos de dados
│   │   ├── conta.model.ts
│   │   ├── transacao.model.ts
│   │   ├── conta-pagar.model.ts
│   │   ├── conta-receber.model.ts
│   │   └── usuario.model.ts
│   ├── app.ts              # Componente raiz
│   ├── app.html            # Template raiz
│   ├── app.css             # Estilos raiz
│   └── app.routes.ts       # Configuração de rotas
├── styles.css              # Estilos globais
└── main.ts                 # Ponto de entrada
```

## 🎨 Design e Estilo

- **CSS Puro**: Sem dependências de frameworks CSS como Tailwind
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Paleta de Cores**: Azul profissional (#3b82f6), verde para receitas (#10b981), vermelho para despesas (#ef4444)
- **Componentes Reutilizáveis**: Sidebar, Header, Cards, Modais, Tabelas

## 💾 Armazenamento de Dados

Os dados são armazenados no **localStorage** do navegador:
- `contas` - Lista de contas
- `transacoes` - Lista de transações
- `contasPagar` - Lista de contas a pagar
- `contasReceber` - Lista de contas a receber
- `usuario` - Informações do usuário

**Nota:** Os dados são persistentes apenas no navegador local. Para sincronizar entre dispositivos, seria necessário integrar um backend.

## 🔄 Fluxo de Dados

1. **Componentes** solicitam dados aos **Serviços**
2. **Serviços** gerenciam estado com **RxJS BehaviorSubject**
3. **Dados** são persistidos no **localStorage**
4. **Componentes** se inscrevem aos observáveis para atualizações em tempo real

## 🛠️ Tecnologias Utilizadas

- **Angular 21** - Framework frontend
- **TypeScript** - Linguagem de programação
- **RxJS** - Programação reativa
- **CSS3** - Estilização
- **localStorage API** - Armazenamento local

## 📝 Funcionalidades Principais

### Dashboard
- Resumo de saldo total
- Receitas e despesas do mês
- Fluxo líquido
- Últimas transações

### Contas
- Criar, editar e deletar contas
- Tipos: Banco, Caixa, Cartão de Crédito, Poupança
- Acompanhar saldo inicial e atual

### Transações
- Registrar receitas e despesas
- Filtrar por tipo e conta
- Categorizar transações
- Editar e deletar registros

### Contas a Pagar/Receber
- Gerenciar obrigações e receitas esperadas
- Status: Pendente, Pago/Recebido, Atrasado
- Datas de vencimento e pagamento

### Fluxo de Caixa
- Análise de período customizável
- Visualizar receitas, despesas e saldo
- Listar todas as transações do período

### Análise
- Gráficos de distribuição
- Percentuais de receitas e despesas
- Análise de fluxo líquido

## 🔐 Segurança

- Sem autenticação implementada (conforme requisito)
- Dados armazenados localmente no navegador
- Sem comunicação com servidor externo

## 📱 Responsividade

A aplicação é totalmente responsiva com breakpoints em:
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🐛 Troubleshooting

### Porta 4200 já está em uso
```bash
ng serve --port 4300
```

### Limpar cache
```bash
npm run clean
# Ou manualmente limpar localStorage no navegador
```

### Reconstruir dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação oficial do Angular em https://angular.dev

## 📄 Licença

Este projeto é fornecido como está para fins educacionais e de demonstração.

---

**Desenvolvido com ❤️ usando Angular 21**
