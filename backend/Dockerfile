FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for OpenCV, EasyOCR, and xhtml2pdf/weasyprint
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["fastapi", "dev", "server.py", "--host", "0.0.0.0", "--port", "8000"]
