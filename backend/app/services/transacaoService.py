import calendar
from datetime import datetime, timezone
from typing import Optional

from app.entidades.transacoes import Transacoes
from app.exceptions.businessException import BusinessException
from app.repositories.transacaoRepository import TransacaoRepository
from app.schemas.transacao import AtualizarTransacao, CriarTransacao, TransacaoResposta


class TransacaoService:
    def __init__(self, repository: TransacaoRepository):
        self.repository = repository

    def criarTransacao(self, empresa_id: int, usuario_id: int, dados: CriarTransacao) -> TransacaoResposta:
        transacao = Transacoes(
            descricao=dados.descricao,
            valor=dados.valor,
            data=dados.data,
            conta_id=dados.conta_id,
            categoria_id=dados.categoria_id,
            transacao_id=dados.tipo,
            situacao=int(dados.situacao),
            notas=dados.notas,
            recorrencia=dados.recorrencia,
            empresa_id=empresa_id,
        )
        try:
            transacao = self.repository.criarTransacao(transacao)
            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(
                self.repository.buscarComRelacionamentos(transacao.id)
            )
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar transação.", status_code=400)

    def listarTransacoes(
        self,
        empresa_id: int,
        usuario_id: int,
        tipo:     Optional[int] = None,
        situacao: Optional[int] = None,
        pesquisa: Optional[str] = None,
    ) -> list[TransacaoResposta]:
        transacoes = self.repository.listarComRelacionamentos(empresa_id, usuario_id)
        if tipo is not None:
            transacoes = [t for t in transacoes if t.transacao_id == tipo]
        if situacao is not None:
            transacoes = [t for t in transacoes if t.situacao == situacao]
        if pesquisa:
            pesquisa_lower = pesquisa.lower()
            transacoes = [t for t in transacoes if pesquisa_lower in (t.descricao or "").lower()]
        return [TransacaoResposta.model_validate(t) for t in transacoes]

    def buscarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int) -> TransacaoResposta:
        transacao = self.repository.buscarComRelacionamentos(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)
        return TransacaoResposta.model_validate(transacao)

    def atualizarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int, dados: AtualizarTransacao) -> TransacaoResposta:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)

        campos = dados.model_dump(exclude_none=True)
        if "tipo" in campos:
            campos["transacao_id"] = int(campos.pop("tipo"))
        if "situacao" in campos:
            campos["situacao"] = int(campos["situacao"])

        try:
            self.repository.atualizarTransacao(transacao, campos)
            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(
                self.repository.buscarComRelacionamentos(transacao.id)
            )
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar transação.", status_code=400)

    def deletarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int) -> None:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)

        try:
            self.repository.deletarTransacao(transacao)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar transação.", status_code=400)

    def gerarRecorrencia(self, empresa_id: int, transacao_id: int, usuario_id: int, parcelas: int = 11) -> list[TransacaoResposta]:
        origem = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not origem:
            raise BusinessException("Transação não encontrada.", status_code=404)

        novas: list[Transacoes] = []
        for i in range(1, parcelas + 1):
            data_base = origem.data
            mes  = data_base.month + i
            ano  = data_base.year + (mes - 1) // 12
            mes  = (mes - 1) % 12 + 1
            dia  = min(data_base.day, calendar.monthrange(ano, mes)[1])
            nova_data = data_base.replace(year=ano, month=mes, day=dia)

            novas.append(Transacoes(
                descricao=origem.descricao,
                valor=origem.valor,
                data=nova_data,
                conta_id=origem.conta_id,
                categoria_id=origem.categoria_id,
                transacao_id=origem.transacao_id,
                situacao=origem.situacao,
                empresa_id=empresa_id,
                recorrencia=origem.recorrencia,
            ))

        try:
            criadas = self.repository.criarEmLote(novas)
            self.repository.session.commit()
            for t in criadas:
                self.repository.session.refresh(t)
            ids = [t.id for t in criadas]
            criadas_completas = [self.repository.buscarComRelacionamentos(i) for i in ids]
            return [TransacaoResposta.model_validate(t) for t in criadas_completas]
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao gerar recorrência.", status_code=400)
