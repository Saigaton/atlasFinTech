import time
import logging

import resend

from app.configuracoes.config import settings

resend.api_key = settings.RESEND_API_KEY
remetente = settings.MAIL_FROM
tentativas = 3
delay = 5

def dispararEmailComTentativas(emailDestino: str, corpoEmail: str, assunto: str):
    params = {
        "from": remetente,
        "to": emailDestino,
        "subject": assunto,
        "html": corpoEmail
    }
    for i in range(tentativas):
        try:
            resend.Emails.send(params)
            return True 
        except Exception as e:
            logging.warning(f"Erro na tentativa {i + 1}: {e}")
            if i < tentativas - 1:
                time.sleep(delay)
            else:
                logging.error(f"Todas as {tentativas} tentativas falharam para {emailDestino}.")
    return False

def corpoEmailRelatorio(conteudo: str) -> str:
    return (
        "<html><body style='font-family:sans-serif'>"
        "<h2 style='color:#1e40af'>Relatório Financeiro</h2>"
        f"<pre style='font-family:Courier New,monospace;font-size:13px;line-height:1.5;"
        f"background:#f8fafc;padding:16px;border-radius:6px'>{conteudo}</pre>"
        "</body></html>"
    )

def corpoEmailVerificacao(link: str) -> str:
    return f"""<p>Olá!</p>
                <p>Para verificar seu e-mail, clique no link abaixo:</p>
                <a href="{link}">Verificar meu e-mail</a>
            """

def corpoEmailParaRecuperarSenha(link: str) -> str:
    return f""" <p>Olá!</p>
                <p>Para recuperar sua senha, clique no link abaixo:</p>
                <a href="{link}">Recuperar minha senha</a>
            """