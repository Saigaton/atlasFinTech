import csv
import io
from datetime import datetime, timezone
from decimal import Decimal

from app.entidades.agendamentos_relatorio import AgendamentosRelatorio
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.exceptions.business_exception import BusinessException
from app.repositories.relatorio_repository import RelatorioRepository
from app.schemas.relatorio import (
    ContasPagarResumoResposta,
    ContasReceberResumoResposta,
    DisparadorRelatorioRequisicao,
    FluxoCaixaResposta,
    InscricaoAgendamentoRequisicao,
    ItemConciliadoResposta,
    ItemExtratoResposta,
    ItemFluxoCaixaResposta,
    ItemPorCategoriaResposta,
    ItemTransacaoSistemaResposta,
    ResultadoConciliacaoResposta,
    StatusAgendamentoResposta,
)


class RelatorioService:
    def __init__(self, repository: RelatorioRepository):
        self.repository = repository

    def fluxoCaixa(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> FluxoCaixaResposta:
        transacoes = self.repository.fluxoCaixa(empresa_id, usuario_id, mes, ano)

        total_receitas = sum((t.valor for t in transacoes if t.tipo_transacao_id == TipoTransacaoEnum.RECEITA), Decimal("0.00"))
        total_despesas = sum((t.valor for t in transacoes if t.tipo_transacao_id == TipoTransacaoEnum.DESPESA), Decimal("0.00"))

        return FluxoCaixaResposta(
            total_receitas=total_receitas,
            total_despesas=total_despesas,
            saldo=total_receitas - total_despesas,
            transacoes=[ItemFluxoCaixaResposta.model_validate(t) for t in transacoes],
        )

    def porCategoria(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> list[ItemPorCategoriaResposta]:
        rows = self.repository.totalPorCategoria(empresa_id, usuario_id, mes, ano)
        return [ItemPorCategoriaResposta(**r) for r in rows]

    def resumoContasPagar(self, empresa_id: int, usuario_id: int) -> ContasPagarResumoResposta:
        dados = self.repository.resumoContasPagar(empresa_id, usuario_id)
        return ContasPagarResumoResposta(**dados)

    def resumoContasReceber(self, empresa_id: int, usuario_id: int) -> ContasReceberResumoResposta:
        dados = self.repository.resumoContasReceber(empresa_id, usuario_id)
        return ContasReceberResumoResposta(**dados)

    # ── Agendamento de relatório ───────────────────────────────────────────

    def statusAgendamento(self, empresa_id: int, usuario_id: int) -> StatusAgendamentoResposta:
        ag = self.repository.buscarAgendamento(empresa_id, usuario_id)
        if not ag:
            return StatusAgendamentoResposta(inscrito=False)
        return StatusAgendamentoResposta(inscrito=True, email=ag.email, diaMes=ag.dia_mes, hora=ag.hora)

    def inscreverAgendamento(self, empresa_id: int, usuario_id: int, dados: InscricaoAgendamentoRequisicao) -> StatusAgendamentoResposta:
        ag = self.repository.buscarAgendamento(empresa_id, usuario_id)
        try:
            if ag:
                ag.email   = dados.email
                ag.dia_mes = dados.dia_mes
                ag.hora    = dados.hora
                ag.ativo   = True
            else:
                ag = AgendamentosRelatorio(empresa_id=empresa_id, email=dados.email, dia_mes=dados.dia_mes, hora=dados.hora)
                self.repository.salvarAgendamento(ag)
            self.repository.session.commit()
            self.repository.session.refresh(ag)
            return StatusAgendamentoResposta(inscrito=True, email=ag.email, diaMes=ag.dia_mes, hora=ag.hora)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao salvar agendamento.", status_code=400)

    def cancelarAgendamento(self, empresa_id: int, usuario_id: int) -> None:
        try:
            self.repository.cancelarAgendamento(empresa_id, usuario_id)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao cancelar agendamento.", status_code=400)

    # ── Exportações CSV ───────────────────────────────────────────────────

    _TIPO_LABEL = {0: "Receita", 1: "Despesa", 3: "Transferência"}
    _SITUACAO_LABEL = {0: "Pendente", 1: "Pago", 2: "Atrasado"}

    def _csv_bytes(self, cabecalho: list[str], linhas: list[list]) -> bytes:
        out = io.StringIO()
        writer = csv.writer(out, delimiter=";")
        writer.writerow(cabecalho)
        writer.writerows(linhas)
        return out.getvalue().encode("utf-8-sig")

    def transacoesCsv(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> bytes:
        transacoes = self.repository.fluxoCaixa(empresa_id, usuario_id, mes, ano)
        linhas = [
            [
                t.id, t.descricao, f"{t.valor:.2f}".replace(".", ","),
                t.data.strftime("%d/%m/%Y"),
                self._TIPO_LABEL.get(int(t.tipo_transacao_id), str(t.tipo_transacao_id)),
                t.categoria_id or "",
            ]
            for t in transacoes
        ]
        return self._csv_bytes(["ID", "Descrição", "Valor (R$)", "Data", "Tipo", "Categoria"], linhas)

    def contas_pagarCsv(self, empresa_id: int, usuario_id: int, mes: int | None = None, ano: int | None = None) -> bytes:
        contas = self.repository.listarContasPagar(empresa_id, usuario_id, mes, ano)
        linhas = [
            [
                c.id, c.descricao, f"{c.valor:.2f}".replace(".", ","),
                c.data_vencimento.strftime("%d/%m/%Y"),
                c.data_pagamento.strftime("%d/%m/%Y") if c.data_pagamento else "",
                c.total_parcelas or 1,
                self._SITUACAO_LABEL.get(int(c.situacao_id) if c.situacao_id is not None else -1, str(c.situacao_id)),
                c.notas or "",
            ]
            for c in contas
        ]
        return self._csv_bytes(["ID", "Descrição", "Valor (R$)", "Vencimento", "Pagamento", "Parcelas", "Situação", "Observações"], linhas)

    def contas_receberCsv(self, empresa_id: int, usuario_id: int, mes: int | None = None, ano: int | None = None) -> bytes:
        contas = self.repository.listarContasReceber(empresa_id, usuario_id, mes, ano)
        linhas = [
            [
                c.id, c.descricao, f"{c.valor:.2f}".replace(".", ","),
                c.data_vencimento.strftime("%d/%m/%Y"),
                c.data_recebimento.strftime("%d/%m/%Y") if c.data_recebimento else "",
                c.cliente or "",
                self._SITUACAO_LABEL.get(int(c.situacao_id) if c.situacao_id is not None else -1, str(c.situacao_id)),
                c.notas or "",
            ]
            for c in contas
        ]
        return self._csv_bytes(["ID", "Descrição", "Valor (R$)", "Vencimento", "Recebimento", "Cliente", "Situação", "Observações"], linhas)

    # ── Relatório texto ───────────────────────────────────────────────────

    def relatorioPdf(self, empresa_id: int, usuario_id: int, mes: int | None, ano: int | None) -> bytes:
        transacoes = self.repository.fluxoCaixa(empresa_id, usuario_id, mes, ano)

        receitas = [t for t in transacoes if int(t.tipo_transacao_id) == TipoTransacaoEnum.RECEITA]
        despesas = [t for t in transacoes if int(t.tipo_transacao_id) == TipoTransacaoEnum.DESPESA]
        total_receitas = sum((t.valor for t in receitas), Decimal("0.00"))
        total_despesas = sum((t.valor for t in despesas), Decimal("0.00"))
        saldo = total_receitas - total_despesas

        meses_nome = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        periodo = f"{meses_nome[mes]}/{ano}" if mes and ano else (f"/{ano}" if ano else (f"{meses_nome[mes]}" if mes else "Todos os períodos"))

        W = 60
        sep = "=" * W
        sub = "-" * W

        def _fmt(v: Decimal) -> str:
            return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        linhas = [
            sep,
            "RELATÓRIO FINANCEIRO".center(W),
            f"Período: {periodo}".center(W),
            f"Gerado em: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC".center(W),
            sep,
            "",
            "RESUMO",
            sub,
            f"  Total de Receitas : {_fmt(total_receitas):>20}",
            f"  Total de Despesas : {_fmt(total_despesas):>20}",
            f"  Saldo do Período  : {_fmt(saldo):>20}",
            f"  Nº de Transações  : {len(transacoes):>20}",
            "",
        ]

        if receitas:
            linhas += ["RECEITAS", sub]
            for t in receitas:
                linhas.append(f"  {t.data.strftime('%d/%m/%Y')}  {t.descricao:<35}  {_fmt(t.valor):>14}")
            linhas.append("")

        if despesas:
            linhas += ["DESPESAS", sub]
            for t in despesas:
                linhas.append(f"  {t.data.strftime('%d/%m/%Y')}  {t.descricao:<35}  {_fmt(t.valor):>14}")
            linhas.append("")

        linhas.append(sep)

        return "\n".join(linhas).encode("utf-8")

    # ── Backup ZIP ────────────────────────────────────────────────────────

    def backupZip(self, empresa_id: int, usuario_id: int) -> bytes:
        import zipfile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("transacoes.csv",      self.transacoesCsv(empresa_id, usuario_id, None, None))
            zf.writestr("contas_a_pagar.csv",  self.contas_pagarCsv(empresa_id, usuario_id))
            zf.writestr("contas_a_receber.csv", self.contas_receberCsv(empresa_id, usuario_id))
        return buf.getvalue()

    # ── Conciliação bancária ──────────────────────────────────────────────

    def conciliar(self, empresa_id: int, usuario_id: int, conteudo: str) -> ResultadoConciliacaoResposta:
        from datetime import date as date_type

        # Descarta a diretiva sep= gerada pelos CSVs exportados pelo sistema
        linhas = conteudo.splitlines()
        if linhas and linhas[0].strip().lower().startswith("sep="):
            conteudo = "\n".join(linhas[1:])

        # Auto-detecta o delimitador (bancos BR usam ; mas aceita , \t |)
        amostra = conteudo[:4096]
        try:
            dialeto = csv.Sniffer().sniff(amostra, delimiters=",;\t|")
            delimitador = dialeto.delimiter
        except csv.Error:
            delimitador = ";" if ";" in amostra else ","

        reader = csv.DictReader(io.StringIO(conteudo), delimiter=delimitador)
        itens_extrato: list[dict] = []
        erros: list[str] = []

        for i, row in enumerate(reader):
            try:
                row_lower = {k.lower().strip(): v.strip() for k, v in row.items()}
                data_str  = row_lower.get("data", "")
                valor_str = row_lower.get("valor", "")
                if not data_str or not valor_str:
                    erros.append(f"Linha {i + 2}: colunas 'data' e 'valor' são obrigatórias")
                    continue

                data: date_type | None = None
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        data = datetime.strptime(data_str, fmt).date()
                        break
                    except ValueError:
                        pass
                if not data:
                    erros.append(f"Linha {i + 2}: data inválida '{data_str}'")
                    continue

                valor_clean = valor_str.replace("R$", "").replace(" ", "").replace("-", "")
                if "," in valor_clean and "." in valor_clean:
                    valor_clean = valor_clean.replace(".", "").replace(",", ".")
                elif "," in valor_clean:
                    valor_clean = valor_clean.replace(",", ".")
                try:
                    valor = Decimal(valor_clean)
                except Exception:
                    erros.append(f"Linha {i + 2}: valor inválido '{valor_str}'")
                    continue

                itens_extrato.append({"data": data, "valor": valor})
            except Exception:
                erros.append(f"Linha {i + 2}: erro ao processar linha")

        transacoes      = self.repository.todasTransacoes(empresa_id, usuario_id)
        usadas: set[int] = set()
        conciliadas:  list[ItemConciliadoResposta]       = []
        so_extrato:   list[ItemExtratoResposta]          = []

        for item in itens_extrato:
            match = None
            for t in transacoes:
                if t.id in usadas:
                    continue
                t_data = t.data.date() if hasattr(t.data, "date") else t.data
                if t_data == item["data"] and abs(t.valor - item["valor"]) < Decimal("0.01"):
                    match = t
                    break
            if match:
                usadas.add(match.id)
                conciliadas.append(ItemConciliadoResposta(
                    dataExtrato=item["data"].strftime("%d/%m/%Y"),
                    valorExtrato=float(item["valor"]),
                    idTransacao=match.id,
                ))
            else:
                so_extrato.append(ItemExtratoResposta(
                    data=item["data"].strftime("%d/%m/%Y"),
                    valor=float(item["valor"]),
                ))

        so_sistema: list[ItemTransacaoSistemaResposta] = [
            ItemTransacaoSistemaResposta(
                id=t.id,
                data=(t.data.date() if hasattr(t.data, "date") else t.data).strftime("%d/%m/%Y"),
                tipo="receita" if int(t.tipo_transacao_id) == TipoTransacaoEnum.RECEITA else "despesa",
                valor=float(t.valor),
            )
            for t in transacoes if t.id not in usadas
        ]

        return ResultadoConciliacaoResposta(
            conciliadas=len(conciliadas),
            totalSomenteExtrato=len(so_extrato),
            totalSomenteNosistema=len(so_sistema),
            totalExtrato=len(itens_extrato),
            itensConciliados=conciliadas,
            somenteExtrato=so_extrato,
            somenteNosistema=so_sistema,
            errosImportacao=erros,
        )
