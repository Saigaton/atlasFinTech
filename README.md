# atlasFinTech — Sistema de Gestão Financeira

Desenvolvimento de um Sistema de Gestão Financeira voltado para a geração de relatórios gerenciais, com foco em apoiar a tomada de decisão empresarial de forma mais estratégica e eficiente.

## Tecnologias

| Camada    | Stack                                      |
|-----------|--------------------------------------------|
| Frontend  | Angular 17+ (standalone), TypeScript, SCSS |
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2.0      |
| Banco     | PostgreSQL                                 |
| Auth      | JWT (Bearer token)                         |

## Funcionalidades

- **Dashboard** — saldo, receitas, despesas e fluxo líquido do período
- **Transações** — cadastro de receitas, despesas e transferências com categorias
- **Contas Bancárias** — múltiplas contas com saldo atualizado
- **Contas a Pagar** — controle de vencimentos, parcelas e situação
- **Contas a Receber** — gestão de recebimentos e inadimplência
- **Relatórios** — exportação CSV, relatório texto (TXT), backup ZIP e envio por e-mail
- **Conciliação Bancária** — importação de extrato CSV e comparação automática com as transações do sistema
- **Agendamento de E-mail** — envio periódico automático do relatório financeiro

## Como executar

### Pré-requisitos

- Python 3.11+
- Node.js 20+
- PostgreSQL rodando localmente

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API estará disponível em `http://localhost:8000`.  
Documentação interativa: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

A aplicação estará disponível em `http://localhost:4200`.

## Módulo de Relatórios — detalhes técnicos

### Exportações disponíveis

| Arquivo              | Conteúdo                                      | Filtro de período |
|----------------------|-----------------------------------------------|-------------------|
| `transacoes.csv`     | Todas as transações (ID, descrição, valor, data, tipo, categoria) | Sim (mês/ano) |
| `contas_a_pagar.csv` | Contas a pagar (vencimento, parcelas, situação, observações)       | Não (exporta tudo) |
| `contas_a_receber.csv` | Contas a receber (vencimento, cliente, situação, observações)    | Não (exporta tudo) |
| `relatorio.txt`      | Resumo financeiro formatado em texto           | Sim (mês/ano) |
| `backup.zip`         | ZIP com os três CSVs acima sem filtro de período | — |

Os CSVs utilizam `;` como separador de colunas (padrão do Excel em português) e encoding UTF-8 com BOM, compatíveis com Microsoft Excel no Windows.

### Conciliação bancária

O sistema aceita extratos bancários em CSV com pelo menos as colunas `data` e `valor` (case-insensitive). Formatos de data aceitos: `YYYY-MM-DD`, `DD/MM/YYYY` e `MM/DD/YYYY`. Valores nos formatos brasileiro (`1.234,56`) e internacional (`1234.56`) são reconhecidos automaticamente.

A conciliação cruza os itens do extrato com as transações cadastradas no sistema usando **data exata + tolerância de R$ 0,01 no valor**. O resultado classifica cada item em: conciliado, somente no extrato ou somente no sistema.

---

## Limitações conhecidas e melhorias futuras

As limitações a seguir foram identificadas durante o desenvolvimento e representam oportunidades de evolução para um ambiente de produção.

### Geração de backup (ZIP)

O endpoint `GET /empresas/{id}/relatorios/backup` carrega **todos os registros das três tabelas na memória** antes de compactar e retornar o arquivo. Para empresas com grande volume de dados isso pode:

- consumir quantidade significativa de RAM no servidor;
- aumentar o tempo de resposta da requisição de forma perceptível;
- bloquear o event loop do FastAPI durante a execução das queries, pois o SQLAlchemy síncrono não libera o controle enquanto aguarda o banco.

**Melhorias recomendadas para produção:**
1. Adotar o driver assíncrono do SQLAlchemy (`asyncpg`) e executar as queries com `await`, liberando o event loop.
2. Gerar os CSVs por streaming e compactar em chunks, evitando acumular o conteúdo completo na memória.
3. Implementar um job assíncrono (ex.: Celery + Redis): o endpoint inicia a tarefa e retorna um ID; o cliente consulta o status e faz o download quando pronto.
4. Adicionar paginação ou limitar o volume exportado por período para reduzir a carga por requisição.

### Exportações CSV individuais

O mesmo padrão de carga completa na memória se aplica aos endpoints de CSV individuais. Para volumes menores o impacto é negligenciável, mas o mesmo conjunto de melhorias acima se aplica.

### Envio de e-mail

O envio de e-mail é disparado como `BackgroundTask` do FastAPI, o que o desacopla da resposta HTTP mas ainda vincula a execução ao processo do servidor. Em produção, uma fila de mensagens dedicada (RabbitMQ, SQS, etc.) ofereceria maior confiabilidade e possibilidade de reenvio em caso de falha.

### Agendamento de relatórios periódicos

O agendamento é salvo no banco de dados, mas a execução depende de um processo externo (cron job ou scheduler) que leia os registros e dispare os e-mails. Esse componente de execução não está incluído no escopo atual do projeto.
