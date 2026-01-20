from fastapi import FastAPI

app = FastAPI(title="PageShare Backend", version="0.1.0")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "PageShare Backend API"}

