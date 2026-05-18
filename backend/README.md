# FastAPI Login API

API de autenticação com FastAPI, JWT e Swagger.

## Requisitos

- Python 3.13+

## Instalação

```bash
# Clone ou extraia o projeto
cd fastapi-login

# Crie e ative o ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows

# Instale as dependências
pip install -r requirements.txt

# Copie o arquivo de variáveis de ambiente
cp .env.example .env
```

## Executar

```bash
uvicorn app.main:app --reload
```

A API estará disponível em: http://localhost:8000

## Documentação

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoint

### POST `/api/v1/auth/login`

Autentica o usuário e retorna um token JWT.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Credenciais de teste:**
| E-mail | Senha |
|--------|-------|
| usuario@exemplo.com | senha123 |
| admin@exemplo.com | admin123 |

**Resposta (200):**
```json
{
  "token": {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "name": "Usuário Exemplo"
  }
}
```

## Estrutura do Projeto

```
fastapi-login/
├── app/
│   ├── core/
│   │   ├── config.py      # Configurações da aplicação
│   │   └── security.py    # JWT e hashing de senhas
│   ├── routers/
│   │   └── auth.py        # Rota de login
│   ├── schemas/
│   │   └── auth.py        # Modelos Pydantic
│   └── main.py            # Inicialização do FastAPI
├── .env.example
├── requirements.txt
└── README.md
```
