from app.entidades.categorias import Categorias
from app.exceptions.business_exception import BusinessException
from app.repositories.categoria_repository import CategoriaRepository
from app.schemas.categoria import AtualizarCategoria, CategoriaResposta, CriarCategoria

# Autor: Davi Santos
class CategoriaService:
    def __init__(self, repository: CategoriaRepository):
        self.repository = repository

    # Cria uma categoria vinculada à empresa com nome, cor e tipo (receita/despesa).
    def criarCategoria(self, empresa_id: int, dados: CriarCategoria) -> CategoriaResposta:
        categoria = Categorias(
            nome=dados.nome,
            empresa_id=empresa_id,
            tipo_categoria_id=int(dados.tipo),
            cor=dados.cor,
        )
        try:
            categoria = self.repository.criarCategoria(categoria)
            self.repository.session.commit()
            self.repository.session.refresh(categoria)
            return CategoriaResposta.model_validate(categoria)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar categoria.", status_code=400)

    # Lista todas as categorias da empresa filtrando pelo usuário dono para garantir isolamento.
    def listarCategorias(self, empresa_id: int, usuario_id: int) -> list[CategoriaResposta]:
        categorias = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        return [CategoriaResposta.model_validate(c) for c in categorias]

    # Mapeamento do campo camelCase do schema para o nome da coluna na entidade.
    _CAMPO_ENTIDADE = {"tipo": "tipo_categoria_id"}

    # Atualiza apenas os campos enviados (PATCH semântico). Converte o campo "tipo" para
    # inteiro e renomeia para "tipo_categoria_id" antes de aplicar na entidade.
    def atualizarCategoria(self, empresa_id: int, categoria_id: int, usuario_id: int, dados: AtualizarCategoria) -> CategoriaResposta:
        categoria = self.repository.buscarPorId(categoria_id, empresa_id, usuario_id)
        if not categoria:
            raise BusinessException("Categoria não encontrada.", status_code=404)

        dados_mapeados = {
            self._CAMPO_ENTIDADE.get(k, k): (int(v) if k == "tipo" else v)
            for k, v in dados.model_dump(exclude_none=True).items()
        }

        try:
            self.repository.atualizarCategoria(categoria, dados_mapeados)
            self.repository.session.commit()
            self.repository.session.refresh(categoria)
            return CategoriaResposta.model_validate(categoria)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar categoria.", status_code=400)

    # Remove a categoria da empresa. Transações vinculadas mantêm a referência (nullable).
    def deletarCategoria(self, empresa_id: int, categoria_id: int, usuario_id: int) -> None:
        categoria = self.repository.buscarPorId(categoria_id, empresa_id, usuario_id)
        if not categoria:
            raise BusinessException("Categoria não encontrada.", status_code=404)

        try:
            self.repository.deletarCategoria(categoria)
            self.repository.session.commit()
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao deletar categoria.", status_code=400)
