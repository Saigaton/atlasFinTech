from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions.businessException import BusinessException

async def businessExceptionHandler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"erro": exc.message, "tipo": "RegraDeNegocio"}
    )

def setupExceptionHandlers(app: FastAPI):
    app.add_exception_handler(BusinessException, businessExceptionHandler)
