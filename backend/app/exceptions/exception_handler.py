from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.exceptions.business_exception import BusinessException

async def business_exceptionHandler(request: Request, exc: BusinessException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"erro": exc.message, "tipo": "RegraDeNegocio"}
    )

async def erroNaoTratadoHandler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"erro": "Ocorreu um erro interno inesperado no servidor.", "detalhe": str(exc)}
    )

def setupExceptionHandlers(app: FastAPI):
    app.add_exception_handler(BusinessException, business_exceptionHandler)
    app.add_exception_handler(Exception, erroNaoTratadoHandler)

