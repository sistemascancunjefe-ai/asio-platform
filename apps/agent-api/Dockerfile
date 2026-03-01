FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry==1.8.3 --no-cache-dir

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies (no dev)
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy app code
COPY . .

# Create sessions directory
RUN mkdir -p app/sessions

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
