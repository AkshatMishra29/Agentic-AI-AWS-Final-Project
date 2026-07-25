

# 1. Use an official lightweight Python 3.12 image as the base
FROM python:3.12-slim

# 2. Set environment variables to prevent Python from writing .pyc files & buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

# 5. Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# 6. Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 7. Copy the rest of the backend source code into the container
COPY . .

# 8. Expose the port Uvicorn listens on
EXPOSE 8000

# 9. Command to start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
