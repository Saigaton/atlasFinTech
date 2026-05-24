import os

# Deve vir antes de qualquer import do app — garante que Settings() não falhe
os.environ.update({
    "SECRET_KEY":                  "test-secret-key-pelo-menos-32-caracteres!!",
    "REFRESH_SECRET_KEY":          "test-refresh-secret-pelo-menos-32-chars!!",
    "ALGORITHM":                   "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "REFRESH_TOKEN_EXPIRE_DAYS":   "7",
    "DATABASE_URL":                "sqlite:///./test_db.db",
    "RESEND_API_KEY":              "re_test_dummy",
    "FRONTEND_URL":                "http://localhost:4200",
    "MAIL_FROM":                   "noreply@test.com",
    "GOOGLE_CLIENT_ID":            "",
})

from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from app.enums.tipo_transacao_enum import TipoTransacaoEnum
from app.enums.situacao_transacao_enum import SituacaoTransacaoEnum
from app.enums.tipo_situacao_conta_enum import TipoSituacaoContaEnum
from app.enums.tipo_conta_enum import TipoContaEnum
from app.enums.tipo_categoria_enum import TipoCategoriaEnum


def make_usuario(**kwargs):
    defaults = dict(
        id=1, nome="João Silva", email="joao@example.com",
        esta_ativo=True, esta_verificado=False,
        data_criacao=datetime(2025, 1, 1, tzinfo=timezone.utc),
        google_id=None, criado_via_google=False, senha_hash="",
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_empresa(**kwargs):
    defaults = dict(
        id=1, usuario_id=1, nome="Empresa Teste", documento=None,
        ativo=True, criado_em=datetime(2025, 1, 1, tzinfo=timezone.utc),
        atualizado_em=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_categoria(**kwargs):
    defaults = dict(
        id=1, nome="Alimentação", empresa_id=1,
        tipo_id=int(TipoCategoriaEnum.DESPESA), cor="#FF0000", esta_ativo=True,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_conta(**kwargs):
    defaults = dict(
        id=1, empresa_id=1, usuario_id=1, nome="Conta Corrente",
        saldo_inicial=Decimal("1000.00"), saldo_atual=Decimal("1000.00"),
        tipo_conta_id=int(TipoContaEnum.CORRENTE),
        agencia=None, nome_banco="Banco Teste",
        data_criacao=datetime(2025, 1, 1, tzinfo=timezone.utc), cor=None,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_transacao(**kwargs):
    defaults = dict(
        id=1, empresa_id=1, descricao="Transação Teste",
        valor=Decimal("100.00"),
        data=datetime(2025, 6, 1, tzinfo=timezone.utc),
        notas=None, recorrencia="nenhuma",
        transacao_id=int(TipoTransacaoEnum.DESPESA),
        situacao=int(SituacaoTransacaoEnum.PENDENTE),
        conta_id=1, categoria_id=None, conta=None, categoria=None,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_conta_pagar(**kwargs):
    defaults = dict(
        id=1, empresa_id=1, descricao="Conta a Pagar",
        valor=Decimal("200.00"),
        data_vencimento=datetime(2027, 12, 31, tzinfo=timezone.utc),
        data_pagamento=None,
        situacao_id=int(TipoSituacaoContaEnum.PENDENTE),
        notas=None, total_parcelas=1,
        conta_id=1, categoria_id=None, transacao_id=None,
        conta=None, categoria=None,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)
