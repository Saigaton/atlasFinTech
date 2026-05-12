from app.entidades.categorias import Categorias
from app.entidades.empresas import Empresas


class CategoriaRepository:
    def __init__(self, session):
        self.session = session

    def criarCategoria(self, categoria: Categorias) -> Categorias:
        self.session.add(categoria)
        return categoria

    def listarPorEmpresa(self, empresa_id: int, usuario_id: int) -> list[Categorias]:
        return (
            self.session.query(Categorias)
            .join(Empresas, Categorias.empresa_id == Empresas.id)
            .filter(Categorias.empresa_id == empresa_id, Empresas.usuario_id == usuario_id)
            .all()
        )

    def buscarPorId(self, categoria_id: int, empresa_id: int, usuario_id: int) -> Categorias | None:
        return (
            self.session.query(Categorias)
            .join(Empresas, Categorias.empresa_id == Empresas.id)
            .filter(
                Categorias.id == categoria_id,
                Categorias.empresa_id == empresa_id,
                Empresas.usuario_id == usuario_id,
            )
            .first()
        )

    def atualizarCategoria(self, categoria: Categorias, dados: dict) -> Categorias:
        for campo, valor in dados.items():
            setattr(categoria, campo, valor)
        return categoria

    def deletarCategoria(self, categoria: Categorias) -> None:
        self.session.delete(categoria)
