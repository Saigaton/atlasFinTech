"""
Migration: tipo_categorias + categorias.tipo_id
Executa UMA ÚNICA VEZ para migrar o campo tipo (string) para tipo_id (FK inteira).

Uso:
    python -m migrations.migrate_categoria_tipo
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.configuracoes.database import engine, Base
from app.entidades import *  # garante que todos os modelos estão registrados


TIPOS = [
    (0, "Receita"),
    (1, "Despesa"),
    (2, "Ambos"),
]


def migrar() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # 1. Seed tipo_categorias
        for id_, nome in TIPOS:
            conn.execute(
                text("INSERT OR IGNORE INTO tipo_categorias (id, nome) VALUES (:id, :nome)"),
                {"id": id_, "nome": nome},
            )
        print("✔ tipo_categorias populado")

        # 2. Adicionar coluna tipo_id se ainda não existe
        colunas = [
            row[1]
            for row in conn.execute(text("PRAGMA table_info(categorias)")).fetchall()
        ]
        if "tipo_id" not in colunas:
            conn.execute(text("ALTER TABLE categorias ADD COLUMN tipo_id INTEGER DEFAULT 1"))
            print("✔ coluna tipo_id adicionada em categorias")
        else:
            print("– coluna tipo_id já existe, pulando ALTER TABLE")

        # 3. Migrar dados: tipo (string "0"/"1"/"2") → tipo_id (int)
        conn.execute(text("""
            UPDATE categorias
            SET    tipo_id = CAST(tipo AS INTEGER)
            WHERE  tipo IS NOT NULL
              AND  tipo != ''
              AND  tipo_id IS NULL
        """))
        # Linhas sem valor válido recebem Despesa como padrão
        conn.execute(text("UPDATE categorias SET tipo_id = 1 WHERE tipo_id IS NULL"))
        print("✔ dados migrados de tipo → tipo_id")

    print("\nMigração concluída com sucesso!")


if __name__ == "__main__":
    migrar()
