import calendar as _cal
from datetime import date, datetime, timezone
from decimal import Decimal

from app.exceptions.business_exception import BusinessException
from app.repositories.analise_repository import AnaliseRepository
from app.schemas.analise import (
    AlertaResposta,
    AnaliseFinanceiraResposta,
    CategoriaTopResposta,
    DadosCalendarioResposta,
    DadosFluxoCaixaResposta,
    EventoCalendarioResposta,
    PagavelCalendarioResposta,
    PrevisaoMesResposta,
    ProjecaoCaixaResposta,
    RecebivelCalendarioResposta,
    RespostaChatbot,
)
from app.enums.tipo_transacao_enum import TipoTransacaoEnum

# Autor: Davi Santos
class AnaliseService:
    def __init__(self, repository: AnaliseRepository):
        self.repository = repository

    # ── Fluxo de caixa (histórico + previsão) ─────────────────────────────

    _MESES_ROTULO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    # Calcula a projeção de fluxo de caixa para os próximos N meses (padrão 3) com base
    # na média de receitas e despesas dos últimos 3 meses. O saldo projetado é acumulado
    # mês a mês somando o líquido projetado ao saldo do último mês histórico.
    def fluxoCaixa(self, empresa_id: int, usuario_id: int, meses_frente: int = 3) -> DadosFluxoCaixaResposta:
        historico_raw = self.repository.historicoPorMes(empresa_id, usuario_id, 3)

        if historico_raw:
            media_receitas = sum(p["receitas"] for p in historico_raw) / len(historico_raw)
            media_despesas = sum(p["despesas"] for p in historico_raw) / len(historico_raw)
            saldo_atual    = historico_raw[-1]["saldo"]
        else:
            media_receitas = media_despesas = saldo_atual = Decimal("0.00")

        hoje = datetime.now(timezone.utc)
        projecao = []
        saldo_acumulado = saldo_atual
        for i in range(1, meses_frente + 1):
            mes = hoje.month + i
            ano = hoje.year + (mes - 1) // 12
            mes = (mes - 1) % 12 + 1
            liquido          = round(media_receitas - media_despesas, 2)
            saldo_acumulado += liquido
            rotulo           = f"{self._MESES_ROTULO[mes - 1]}/{str(ano)[2:]}"
            projecao.append(ProjecaoCaixaResposta(
                rotulo=rotulo,
                receitaProjetada=round(media_receitas, 2),
                despesaProjetada=round(media_despesas, 2),
                liquido=liquido,
                saldoProjetado=round(saldo_acumulado, 2),
            ))

        return DadosFluxoCaixaResposta(saldoAtual=round(saldo_atual, 2), projecao=projecao)

    # ── Análise financeira do período ─────────────────────────────────────

    # Calcula métricas financeiras completas do período (mês/ano ou mês atual por padrão):
    # receitas, despesas, lucro líquido, margem de lucro (%), ticket médio por tipo e
    # as top categorias de receita e despesa ordenadas por volume.
    def analiseFinanceira(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> AnaliseFinanceiraResposta:
        hoje = datetime.now(timezone.utc)
        m = mes or hoje.month
        a = ano or hoje.year

        transacoes = self.repository.transacoesPorMes(empresa_id, usuario_id, m, a)
        receitas = [t.valor for t in transacoes if t.tipo_transacao_id == TipoTransacaoEnum.RECEITA]
        despesas = [t.valor for t in transacoes if t.tipo_transacao_id == TipoTransacaoEnum.DESPESA]

        total_r  = sum(receitas, Decimal("0.00"))
        total_d  = sum(despesas, Decimal("0.00"))
        lucro    = total_r - total_d
        margem   = round(lucro / total_r * 100, 1) if total_r > 0 else None

        top_d = self.repository.topCategorias(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, m, a)
        top_r = self.repository.topCategorias(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, m, a)

        return AnaliseFinanceiraResposta(
            totalReceita=total_r,
            totalDespesa=total_d,
            lucroLiquido=lucro,
            margemLucro=margem,
            crescimentoReceita=None,
            crescimentoDespesa=None,
            crescimentoLucro=None,
            totalTransacoes=len(transacoes),
            ticketMedioReceita=round(total_r / len(receitas), 2) if receitas else Decimal("0.00"),
            transacoesReceita=len(receitas),
            ticketMedioDespesa=round(total_d / len(despesas), 2) if despesas else Decimal("0.00"),
            transacoesDespesa=len(despesas),
            principaisDespesasCategorias=[CategoriaTopResposta(**c) for c in top_d],
            principaisReceitasCategorias=[CategoriaTopResposta(**c) for c in top_r],
        )

    # ── Alertas ───────────────────────────────────────────────────────────

    # Varre a empresa em busca de problemas financeiros e gera alertas em dois níveis:
    # crítico (tipo 0) para contas bancárias com saldo negativo, contas vencidas e
    # transações inadimplentes; aviso (tipo 1) para contas que vencem hoje.
    def alertas(self, empresa_id: int, usuario_id: int) -> list[AlertaResposta]:
        resultado: list[AlertaResposta] = []

        for cb in self.repository.contasBancariasNegativas(empresa_id, usuario_id):
            resultado.append(AlertaResposta(
                tipo=0,
                titulo="Saldo negativo",
                mensagem=f"{cb.nome} — saldo atual: R$ {cb.saldo_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                rotaAcao="/contas",
            ))

        for cp in self.repository.contas_pagar_vencidas(empresa_id, usuario_id):
            resultado.append(AlertaResposta(
                tipo=0,
                titulo="Conta a pagar vencida",
                mensagem=f"{cp.descricao} — venceu em {cp.data_vencimento.strftime('%d/%m/%Y')}",
                rotaAcao="/contas-pagar",
            ))

        for cr in self.repository.contas_receber_vencidas(empresa_id, usuario_id):
            resultado.append(AlertaResposta(
                tipo=0,
                titulo="Conta a receber vencida",
                mensagem=f"{cr.descricao} — venceu em {cr.data_vencimento.strftime('%d/%m/%Y')}",
                rotaAcao="/contas-receber",
            ))

        for t in self.repository.transacoesVencidas(empresa_id, usuario_id):
            if int(t.tipo_transacao_id) == TipoTransacaoEnum.DESPESA:
                resultado.append(AlertaResposta(
                    tipo=0,
                    titulo="Transação de despesa inadimplente",
                    mensagem=f"{t.descricao} — venceu em {t.data.strftime('%d/%m/%Y')}",
                    rotaAcao="/transacoes",
                ))
            elif int(t.tipo_transacao_id) == TipoTransacaoEnum.RECEITA:
                resultado.append(AlertaResposta(
                    tipo=0,
                    titulo="Transação de receita inadimplente",
                    mensagem=f"{t.descricao} — venceu em {t.data.strftime('%d/%m/%Y')}",
                    rotaAcao="/transacoes",
                ))

        for cp in self.repository.contas_pagar_proximas_vencer(empresa_id, usuario_id):
            resultado.append(AlertaResposta(
                tipo=1,
                titulo="Conta a pagar vence hoje",
                mensagem=f"{cp.descricao} — vence em {cp.data_vencimento.strftime('%d/%m/%Y')}",
                rotaAcao="/contas-pagar",
            ))

        for cr in self.repository.contas_receber_proximas_vencer(empresa_id, usuario_id):
            resultado.append(AlertaResposta(
                tipo=1,
                titulo="Conta a receber vence hoje",
                mensagem=f"{cr.descricao} — vence em {cr.data_vencimento.strftime('%d/%m/%Y')}",
                rotaAcao="/contas-receber",
            ))

        return resultado

    # ── Calendário financeiro ─────────────────────────────────────────────

    _MESES_NOME_CAL = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    _SITUACAO_CAL   = {0: "Pendente", 1: "Pago", 2: "Atrasado"}

    # Monta o calendário financeiro do mês com todas as contas a pagar e a receber agrupadas
    # por data de vencimento. Retorna também metadados do mês (total de dias, primeiro dia da
    # semana) necessários para renderizar a grade do calendário no frontend.
    def calendario(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> DadosCalendarioResposta:
        hoje = datetime.now(timezone.utc)
        m = mes or hoje.month
        a = ano or hoje.year

        primeiro_dia_semana = _cal.weekday(a, m, 1)   # 0=Seg … 6=Dom (igual ao cabeçalho do frontend)
        dias_no_mes         = _cal.monthrange(a, m)[1]

        pagar   = self.repository.contas_pagar_por_mes(empresa_id, usuario_id, m, a)
        receber = self.repository.contas_receber_por_mes(empresa_id, usuario_id, m, a)

        eventos: dict[str, dict] = {}

        def _evento(data_str: str) -> dict:
            if data_str not in eventos:
                eventos[data_str] = {
                    "data": data_str,
                    "pagaveis": [],
                    "recebiveis": [],
                    "totalPagar": Decimal("0.00"),
                    "totalReceber": Decimal("0.00"),
                }
            return eventos[data_str]

        for cp in pagar:
            venc = cp.data_vencimento.date() if hasattr(cp.data_vencimento, "date") else cp.data_vencimento
            ev   = _evento(venc.strftime("%Y-%m-%d"))
            sit  = self._SITUACAO_CAL.get(int(cp.situacao_id) if cp.situacao_id is not None else -1, "—")
            ev["pagaveis"].append(PagavelCalendarioResposta(
                id=cp.id, descricao=cp.descricao, valor=cp.valor, situacao=sit,
            ))
            ev["totalPagar"] += cp.valor

        for cr in receber:
            venc = cr.data_vencimento.date() if hasattr(cr.data_vencimento, "date") else cr.data_vencimento
            ev   = _evento(venc.strftime("%Y-%m-%d"))
            sit  = self._SITUACAO_CAL.get(int(cr.situacao_id) if cr.situacao_id is not None else -1, "—")
            ev["recebiveis"].append(RecebivelCalendarioResposta(
                id=cr.id, descricao=cr.descricao, valor=cr.valor, situacao=sit,
                nomeCliente=getattr(cr, "cliente", None) or None,
            ))
            ev["totalReceber"] += cr.valor

        lista_eventos = [EventoCalendarioResposta(**ev) for ev in sorted(eventos.values(), key=lambda x: x["data"])]
        total_pagar   = sum((e.totalPagar   for e in lista_eventos), Decimal("0.00"))
        total_receber = sum((e.totalReceber for e in lista_eventos), Decimal("0.00"))

        return DadosCalendarioResposta(
            ano=a,
            mes=m,
            rotulo=f"{self._MESES_NOME_CAL[m]} {a}",
            primeiroDiaSemana=primeiro_dia_semana,
            diasNoMes=dias_no_mes,
            totalPagar=total_pagar,
            totalReceber=total_receber,
            eventos=lista_eventos,
        )

    # ── Previsão do mês atual ─────────────────────────────────────────────

    # Projeta receitas e despesas do mês atual baseando-se na média dos últimos 3 meses.
    # Retorna também o número de dias restantes no mês para contextualizar a previsão.
    def previsaoMes(self, empresa_id: int, usuario_id: int) -> PrevisaoMesResposta:
        historico  = self.repository.historicoPorMes(empresa_id, usuario_id, 3)
        hoje       = datetime.now(timezone.utc)
        dias_mes   = _cal.monthrange(hoje.year, hoje.month)[1]
        dias_rest  = dias_mes - hoje.day

        if not historico:
            return PrevisaoMesResposta(
                ePositivo=True,
                saldoProjetado=Decimal("0.00"),
                receitaProjetada=Decimal("0.00"),
                despesaProjetada=Decimal("0.00"),
                diasRestantes=dias_rest,
            )

        media_r = sum(p["receitas"] for p in historico) / len(historico)
        media_d = sum(p["despesas"] for p in historico) / len(historico)
        saldo   = round(media_r - media_d, 2)
        return PrevisaoMesResposta(
            ePositivo=saldo >= 0,
            saldoProjetado=saldo,
            receitaProjetada=round(media_r, 2),
            despesaProjetada=round(media_d, 2),
            diasRestantes=dias_rest,
        )

    # ── Chatbot ───────────────────────────────────────────────────────────

    _MESES_NOME = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    @staticmethod
    def _fmt(v) -> str:
        return f"R$ {float(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    # Roteador de perguntas em linguagem natural: analisa palavras-chave na mensagem e
    # delega para o método de análise correspondente. Retorna uma resposta formatada
    # em Markdown pronta para exibição no frontend.
    def chatbot(self, empresa_id: int, usuario_id: int, mensagem: str) -> RespostaChatbot:
        msg = mensagem.strip().lower()

        if "saldo" in msg:
            return RespostaChatbot(resposta=self._chat_saldo(empresa_id, usuario_id))
        if "como foi" in msg or ("mês" in msg and "projeç" not in msg and "próximo" not in msg):
            return RespostaChatbot(resposta=self._chat_mes(empresa_id, usuario_id))
        if "a pagar" in msg or "pagar" in msg:
            return RespostaChatbot(resposta=self._chat_pagar(empresa_id, usuario_id))
        if "problema" in msg or "alerta" in msg:
            return RespostaChatbot(resposta=self._chat_problemas(empresa_id, usuario_id))
        if "margem" in msg:
            return RespostaChatbot(resposta=self._chat_margem(empresa_id, usuario_id))
        if "transaç" in msg or "transac" in msg or "últimas" in msg or "ultimas" in msg:
            return RespostaChatbot(resposta=self._chat_transacoes(empresa_id, usuario_id))
        if "projeç" in msg or "projec" in msg or "próximo" in msg or "proximo" in msg:
            return RespostaChatbot(resposta=self._chat_projecao(empresa_id, usuario_id))
        if "a receber" in msg or "receber" in msg:
            return RespostaChatbot(resposta=self._chat_receber(empresa_id, usuario_id))

        return RespostaChatbot(resposta=self._chat_padrao())

    # Retorna o resumo financeiro do mês atual: receitas, despesas e saldo do período.
    def _chat_saldo(self, empresa_id: int, usuario_id: int) -> str:
        hoje = datetime.now(timezone.utc)
        m, a = hoje.month, hoje.year
        receitas = self.repository.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, m, a)
        despesas = self.repository.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, m, a)
        saldo = receitas - despesas
        sinal = "positivo ✅" if saldo >= 0 else "negativo ⚠️"
        return (
            f"**Resumo financeiro — {self._MESES_NOME[m]}/{a}**\n\n"
            f"Receitas: {self._fmt(receitas)}\n"
            f"Despesas: {self._fmt(despesas)}\n"
            f"{'─' * 30}\n"
            f"Saldo do período: {self._fmt(saldo)} ({sinal})"
        )

    # Retorna o desempenho detalhado do mês atual com receitas, despesas, lucro e margem.
    def _chat_mes(self, empresa_id: int, usuario_id: int) -> str:
        hoje = datetime.now(timezone.utc)
        m, a = hoje.month, hoje.year
        transacoes = self.repository.transacoesPorMes(empresa_id, usuario_id, m, a)
        receitas = [t for t in transacoes if int(t.tipo_transacao_id) == TipoTransacaoEnum.RECEITA]
        despesas = [t for t in transacoes if int(t.tipo_transacao_id) == TipoTransacaoEnum.DESPESA]
        total_r  = sum((t.valor for t in receitas), Decimal("0.00"))
        total_d  = sum((t.valor for t in despesas), Decimal("0.00"))
        lucro    = total_r - total_d
        margem   = f"{round(lucro / total_r * 100, 1)}%" if total_r > 0 else "—"
        if not transacoes:
            return f"Ainda não há transações registradas em {self._MESES_NOME[m]}/{a}."
        return (
            f"**Desempenho — {self._MESES_NOME[m]}/{a}**\n\n"
            f"Receitas: {self._fmt(total_r)} ({len(receitas)} transações)\n"
            f"Despesas: {self._fmt(total_d)} ({len(despesas)} transações)\n"
            f"Lucro líquido: {self._fmt(lucro)}\n"
            f"Margem de lucro: {margem}\n"
            f"Total de transações: {len(transacoes)}"
        )

    # Lista as contas a pagar pendentes com valores, datas e indicação de atraso.
    def _chat_pagar(self, empresa_id: int, usuario_id: int) -> str:
        contas = self.repository.contas_pagar_pendentes(empresa_id, usuario_id)
        if not contas:
            return "Nenhuma conta a pagar pendente. Tudo em dia! ✅"
        total = sum((c.valor for c in contas), Decimal("0.00"))
        hoje  = datetime.now(timezone.utc).date()
        linhas = [f"**Contas a pagar pendentes ({len(contas)})**\n"]
        for c in contas[:10]:
            venc  = c.data_vencimento.date() if hasattr(c.data_vencimento, "date") else c.data_vencimento
            atraso = " ⚠️ vencida" if venc < hoje else ""
            linhas.append(f"• {c.descricao} — {self._fmt(c.valor)} — vence {venc.strftime('%d/%m/%Y')}{atraso}")
        if len(contas) > 10:
            linhas.append(f"... e mais {len(contas) - 10} conta(s).")
        linhas.append(f"\n**Total pendente: {self._fmt(total)}**")
        return "\n".join(linhas)

    # Reutiliza o método alertas() para listar problemas críticos e avisos formatados.
    def _chat_problemas(self, empresa_id: int, usuario_id: int) -> str:
        alertas = self.alertas(empresa_id, usuario_id)
        if not alertas:
            return "Nenhum alerta encontrado. Suas finanças estão em dia! ✅"
        criticos = [a for a in alertas if a.tipo == 0]
        avisos   = [a for a in alertas if a.tipo == 1]
        linhas = [f"**{len(alertas)} alerta(s) encontrado(s)**\n"]
        if criticos:
            linhas.append("🔴 **Problemas críticos:**")
            for a in criticos:
                linhas.append(f"  • {a.titulo} — {a.mensagem}")
        if avisos:
            linhas.append("\n🟡 **Avisos:**")
            for a in avisos:
                linhas.append(f"  • {a.titulo} — {a.mensagem}")
        return "\n".join(linhas)

    # Calcula e classifica a margem de lucro do mês atual em excelente (≥20%), boa (≥0%) ou negativa.
    def _chat_margem(self, empresa_id: int, usuario_id: int) -> str:
        hoje = datetime.now(timezone.utc)
        m, a = hoje.month, hoje.year
        receitas = self.repository.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.RECEITA, m, a)
        despesas = self.repository.totalMensal(empresa_id, usuario_id, TipoTransacaoEnum.DESPESA, m, a)
        lucro = receitas - despesas
        if receitas == 0:
            return f"Sem receitas registradas em {self._MESES_NOME[m]}/{a} para calcular a margem."
        margem = round(float(lucro) / float(receitas) * 100, 1)
        avaliacao = "excelente 🟢" if margem >= 20 else ("boa 🟡" if margem >= 0 else "negativa 🔴")
        return (
            f"**Margem de lucro — {self._MESES_NOME[m]}/{a}**\n\n"
            f"Receitas: {self._fmt(receitas)}\n"
            f"Despesas: {self._fmt(despesas)}\n"
            f"Lucro: {self._fmt(lucro)}\n"
            f"Margem: **{margem}%** ({avaliacao})"
        )

    # Lista as últimas 5 transações da empresa com data, descrição, tipo e valor.
    def _chat_transacoes(self, empresa_id: int, usuario_id: int) -> str:
        transacoes = self.repository.ultimasTransacoes(empresa_id, usuario_id, 5)
        if not transacoes:
            return "Nenhuma transação encontrada."
        linhas = ["**Últimas 5 transações**\n"]
        for t in transacoes:
            data = t.data.strftime("%d/%m") if hasattr(t.data, "strftime") else str(t.data)
            tipo = "Receita" if int(t.tipo_transacao_id) == TipoTransacaoEnum.RECEITA else "Despesa"
            linhas.append(f"• {data} — {t.descricao} — {tipo} — {self._fmt(t.valor)}")
        return "\n".join(linhas)

    # Usa a previsaoMes() para gerar uma projeção formatada do próximo mês.
    def _chat_projecao(self, empresa_id: int, usuario_id: int) -> str:
        previsao = self.previsaoMes(empresa_id, usuario_id)
        hoje     = datetime.now(timezone.utc)
        prox_mes = hoje.month % 12 + 1
        prox_ano = hoje.year + (1 if hoje.month == 12 else 0)
        sinal = "positivo ✅" if previsao.saldoProjetado >= 0 else "negativo ⚠️"
        return (
            f"**Projeção para {self._MESES_NOME[prox_mes]}/{prox_ano}**\n"
            f"_(baseada na média dos últimos 3 meses)_\n\n"
            f"Receitas projetadas: {self._fmt(previsao.receitaProjetada)}\n"
            f"Despesas projetadas: {self._fmt(previsao.despesaProjetada)}\n"
            f"Saldo projetado: {self._fmt(previsao.saldoProjetado)} ({sinal})"
        )

    # Lista as contas a receber pendentes com valores, datas e indicação de atraso.
    def _chat_receber(self, empresa_id: int, usuario_id: int) -> str:
        contas = self.repository.contas_receber_pendentes(empresa_id, usuario_id)
        if not contas:
            return "Nenhuma conta a receber pendente no momento."
        total = sum((c.valor for c in contas), Decimal("0.00"))
        hoje  = datetime.now(timezone.utc).date()
        linhas = [f"**Contas a receber pendentes ({len(contas)})**\n"]
        for c in contas[:10]:
            venc  = c.data_vencimento.date() if hasattr(c.data_vencimento, "date") else c.data_vencimento
            atraso = " ⚠️ vencida" if venc < hoje else ""
            linhas.append(f"• {c.descricao} — {self._fmt(c.valor)} — vence {venc.strftime('%d/%m/%Y')}{atraso}")
        if len(contas) > 10:
            linhas.append(f"... e mais {len(contas) - 10} conta(s).")
        linhas.append(f"\n**Total a receber: {self._fmt(total)}**")
        return "\n".join(linhas)

    # Resposta padrão para perguntas não reconhecidas, orientando o usuário aos tópicos suportados.
    @staticmethod
    def _chat_padrao() -> str:
        return (
            "Entendi sua pergunta, mas no momento só consigo responder com dados reais "
            "às perguntas sugeridas.\n\n"
            "**Melhoria futura:** integrar um modelo de inteligência artificial (como Claude ou GPT-4) "
            "permitiria responder qualquer pergunta financeira de forma conversacional, "
            "analisando seus dados automaticamente.\n\n"
            "Por enquanto, use os botões de sugestão para consultar:\n"
            "• Saldo atual do período\n"
            "• Desempenho do mês\n"
            "• Contas a pagar / a receber\n"
            "• Alertas e problemas\n"
            "• Margem de lucro\n"
            "• Últimas transações\n"
            "• Projeção do próximo mês"
        )
