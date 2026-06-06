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


# ── Bloco base reutilizado por todos os templates ─────────────────────────────

def _base_email(titulo: str, corpo: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f1f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f4f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

        <!-- Cabeçalho -->
        <tr><td style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);border-radius:16px 16px 0 0;padding:28px 32px">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:38px;height:38px;background:rgba(255,255,255,0.2);border-radius:10px;text-align:center;vertical-align:middle">
                      <span style="color:#ffffff;font-size:20px;font-weight:800;line-height:38px">A</span>
                    </td>
                    <td style="padding-left:10px;vertical-align:middle">
                      <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px">Atlas FinTech</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Corpo -->
        <tr><td style="background:#ffffff;padding:36px 32px">
          {corpo}
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
            © 2025 Atlas FinTech &nbsp;·&nbsp; Gestão Financeira Inteligente<br>
            Este é um e-mail automático, não responda a esta mensagem.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _botao(link: str, texto: str) -> str:
    return f"""<table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0">
      <tr><td align="center">
        <a href="{link}"
           style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
                  color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;
                  padding:14px 36px;border-radius:10px;letter-spacing:-0.1px">
          {texto}
        </a>
      </td></tr>
    </table>"""


def _link_fallback(link: str) -> str:
    return f"""<p style="margin:20px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
    </p>
    <p style="margin:6px 0 0;font-size:12px;color:#2563eb;word-break:break-all">{link}</p>"""


# ── Templates ────────────────────────────────────────────────────────────────

def corpoEmailVerificacao(link: str) -> str:
    corpo = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px">
        Confirme seu e-mail
      </h1>
      <p style="margin:0 0 4px;font-size:14px;color:#64748b;line-height:1.7">
        Obrigado por criar sua conta no <strong style="color:#0f172a">Atlas FinTech</strong>!
        Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.
      </p>

      {_botao(link, "Verificar meu e-mail")}

      {_link_fallback(link)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px">
        <tr><td style="border-top:1px solid #e2e8f0;padding-top:20px">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
            Se você não criou uma conta no Atlas FinTech, ignore este e-mail com segurança.
            Este link expira em <strong style="color:#64748b">24 horas</strong>.
          </p>
        </td></tr>
      </table>"""
    return _base_email("Confirme seu e-mail — Atlas FinTech", corpo)


def corpoEmailParaRecuperarSenha(link: str) -> str:
    corpo = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px">
        Redefinição de senha
      </h1>
      <p style="margin:0 0 4px;font-size:14px;color:#64748b;line-height:1.7">
        Recebemos uma solicitação para redefinir a senha da sua conta no
        <strong style="color:#0f172a">Atlas FinTech</strong>.
        Clique no botão abaixo para criar uma nova senha.
      </p>

      {_botao(link, "Redefinir minha senha")}

      {_link_fallback(link)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr><td style="background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:14px 16px">
          <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6">
            <strong>Atenção:</strong> se você não solicitou a redefinição de senha, ignore este e-mail.
            Sua senha permanece a mesma e este link expira em <strong>1 hora</strong>.
          </p>
        </td></tr>
      </table>"""
    return _base_email("Redefinição de senha — Atlas FinTech", corpo)


def corpoEmailRelatorio(conteudo: str) -> str:
    corpo = f"""
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.3px">
        Relatório Financeiro
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7">
        Seu relatório financeiro agendado está pronto. Confira o resumo abaixo.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 20px">
          <pre style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;
                      line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-word">{conteudo}</pre>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
        <tr><td style="border-top:1px solid #e2e8f0;padding-top:20px">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
            Este relatório foi gerado automaticamente com base nas suas configurações de agendamento.
          </p>
        </td></tr>
      </table>"""
    return _base_email("Relatório Financeiro — Atlas FinTech", corpo)
