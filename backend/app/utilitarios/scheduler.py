import logging
import logging.config
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.configuracoes.database import SessionLocal
from app.entidades.agendamentosRelatorio import AgendamentosRelatorio
from app.entidades.empresas import Empresas
from app.repositories.relatorioRepository import RelatorioRepository
from app.services.relatorioService import RelatorioService
from app.utilitarios.emailUtilitario import corpoEmailRelatorio, dispararEmailComTentativas

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def _enviar_relatorios_agendados() -> None:
    agora      = datetime.now()          # horário local do servidor
    dia_hoje   = agora.day
    hora_atual = agora.hour

    logger.info("Scheduler: verificando agendamentos para dia=%d hora=%d (horário local)", dia_hoje, hora_atual)

    with SessionLocal() as db:
        agendamentos = (
            db.query(AgendamentosRelatorio)
            .filter(
                AgendamentosRelatorio.ativo   == True,
                AgendamentosRelatorio.dia_mes == dia_hoje,
                AgendamentosRelatorio.hora    == hora_atual,
            )
            .all()
        )

        if not agendamentos:
            logger.info("Scheduler: nenhum agendamento encontrado.")
            return

        logger.info("Scheduler: %d agendamento(s) a processar.", len(agendamentos))

        for ag in agendamentos:
            try:
                empresa = db.query(Empresas).filter(Empresas.id == ag.empresa_id).first()
                if not empresa:
                    logger.warning("Scheduler: empresa %d não encontrada, pulando.", ag.empresa_id)
                    continue

                repo    = RelatorioRepository(db)
                service = RelatorioService(repo)
                relatorio = service.relatorioPdf(ag.empresa_id, empresa.usuario_id, None, None)
                corpo     = corpoEmailRelatorio(relatorio.decode("utf-8"))

                enviado = dispararEmailComTentativas(ag.email, corpo, "Relatório Financeiro Mensal — Atlas FinTech")
                if enviado:
                    logger.info("Scheduler: relatório enviado para %s (empresa %d).", ag.email, ag.empresa_id)
                else:
                    logger.error("Scheduler: falha ao enviar para %s (empresa %d).", ag.email, ag.empresa_id)

            except Exception:
                logger.exception("Scheduler: erro inesperado ao processar agendamento id=%d.", ag.id)


def criar_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()   # usa o fuso horário local do servidor
    scheduler.add_job(
        _enviar_relatorios_agendados,
        trigger=CronTrigger(minute=0),  # dispara no minuto 0 de cada hora
        id="relatorios_agendados",
        replace_existing=True,
    )
    return scheduler
