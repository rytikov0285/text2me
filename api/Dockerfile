FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 GAR_API_PORT=8080 GAR_DATABASE_PATH=/data/gar-address-index.sqlite
WORKDIR /app
COPY api/gar_api.py /app/gar_api.py
USER 10001:10001
EXPOSE 8080
CMD ["python", "/app/gar_api.py"]
