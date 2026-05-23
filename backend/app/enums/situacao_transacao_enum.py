import enum

class SituacaoTransacaoEnum(enum.IntEnum):
    PENDENTE   = 0
    CONFIRMADO = 1
    CANCELADO  = 2
