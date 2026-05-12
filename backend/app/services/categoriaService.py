from app.entidades.categorias import Categorias
from app.exceptions.businessException import BusinessException
from app.repositories.categoriaRepository import CategoriaRepository
from app.schemas.categoria import AtualizarCategoria, CategoriaResposta, CriarCategoria


class CategoriaService:
    def __init__(self, repository: CategoriaRepository):
        self.repository = repository

    def criarCategoria(self, empresa_id: int, usuario_id: int, dados: CriarCategoria) -> CategoriaResposta:
        categoria = Categorias(nome=dados.nome, empresa_id=empresa_id)
        try:
            categoria = self.repository.criarCategoria(categoria)
            self.repository.session.commit()
            self.repository.session.refresh(categoria)
            return CategoriaResposta.model_validate(categoria)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao criar categoria.", status_code=400)

    def listarCategorias(self, empresa_id: int, usuario_id: int) -> list[CategoriaResposta]:
        categorias = self.repository.listarPorEmpresa(empresa_id, usuario_id)
        return [CategoriaResposta.model_validate(c) for c in categorias]

    def atualizarCategoria(self, empresa_id: int, categoria_id: int, usuario_id: int, dados: AtualizarCategoria) -> CategoriaResposta:
        categoria = self.repository.buscarPorId(categoria_id, empresa_id, usuario_id)
        if not categoria:
            raise BusinessException("Categoria não encontrada.", status_code=404)

        try:
            self.repository.atualizarCategoria(categoria, dados.model_dump(exclude_none=True))
            self.repository.session.commit()
            self.repository.session.refresh(categoria)
            return CategoriaResposta.model_validate(categoria)
        except Exception:
            self.repository.session.rollback()
            raise BusinessException("Erro ao atualizar categoria.", status_code=400)

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
