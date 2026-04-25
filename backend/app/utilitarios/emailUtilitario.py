import time
import logging

import resend

from app.configuracoes.config import settings

resend.api_key = settings.RESEND_API_KEY
tentativas = 3
delay = 5

def dispararEmailComTentativas(emailDestino: str, corpoEmail: str, assunto: str):
    params = {
        "from": "Atlas Fintech <onboarding@resend.dev>",
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

def corpoEmailParaRecuperarSenha(link: str) -> str:
    return f""" <p>Olá!</p>
                <p>Para recuperar sua senha, clique no link abaixo:</p>
                <a href="{link}">Recuperar minha senha</a>
            """