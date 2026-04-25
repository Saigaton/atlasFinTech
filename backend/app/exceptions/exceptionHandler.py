from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.exceptions.businessException import BusinessException

async def businessExceptionHandler(request: Request, exc: BusinessException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"erro": exc.message, "tipo": "RegraDeNegocio"}
    )

async def erroNaoTratadoHandler(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"erro": "Ocorreu um erro interno inesperado no servidor."}
    )

def setupExceptionHandlers(app: FastAPI):
    app.add_exception_handler(BusinessException, businessExceptionHandler)
    app.add_exception_handler(Exception, erroNaoTratadoHandler)

