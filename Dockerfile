FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Environment variables
ENV FLASK_ENV=production \
    PORT=5000 \
    PYTHONUNBUFFERED=1

EXPOSE 5000

# Generate synthetic dataset, train baseline model, and launch API
CMD ["sh", "-c", "python generate_data.py && python train_model.py && python backend/run.py"]
