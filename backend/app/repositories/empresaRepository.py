from app.entidades.empresas import Empresas


class EmpresaRepository:
    def __init__(self, session):
        self.session = session

    def criarEmpresa(self, empresa: Empresas) -> Empresas:
        self.session.add(empresa)
        return empresa

    def listarEmpresasPorUsuario(self, usuario_id: int) -> list[Empresas]:
        return self.session.query(Empresas).filter(Empresas.usuario_id == usuario_id).all()
