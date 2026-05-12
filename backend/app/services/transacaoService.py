from datetime import datetime, timezone

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
            categoria_id=dados.categoria_id,
            transacao_id=dados.tipo,
            empresa_id=empresa_id,
        )
        try:
            transacao = self.repository.criarTransacao(transacao)
            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(transacao)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar transação.", status_code=400)

    def listarTransacoes(self, empresa_id: int, usuario_id: int) -> list[TransacaoResposta]:
        transacoes = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        return [TransacaoResposta.model_validate(t) for t in transacoes]

    def buscarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int) -> TransacaoResposta:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)
        return TransacaoResposta.model_validate(transacao)

    def atualizarTransacao(self, empresa_id: int, transacao_id: int, usuario_id: int, dados: AtualizarTransacao) -> TransacaoResposta:
        transacao = self.repository.buscarPorId(transacao_id, empresa_id, usuario_id)
        if not transacao:
            raise BusinessException("Transação não encontrada.", status_code=404)

        campos = dados.model_dump(exclude_none=True)
        if "tipo" in campos:
            campos["transacao_id"] = campos.pop("tipo")

        try:
            self.repository.atualizarTransacao(transacao, campos)
            self.repository.session.commit()
            self.repository.session.refresh(transacao)
            return TransacaoResposta.model_validate(transacao)
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
