import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()

results = {}

print("=== MODULE 3 PRE-FLIGHT CHECK ===\n")

# 1. Check packages
print("--- [1] PACKAGES ---")
pkgs = {
    "boto3": "boto3",
    "groq": "groq",
    "langgraph": "langgraph",
    "langchain": "langchain",
    "langchain_groq": "langchain-groq",
    "langchain_aws": "langchain-aws",
    "langchain_community": "langchain-community",
}
all_ok = True
for mod, pkg in pkgs.items():
    try:
        __import__(mod)
        print(f"  [PASS] {pkg}")
    except ImportError:
        print(f"  [FAIL] {pkg} — NOT INSTALLED")
        all_ok = False

# 2. Env Keys
print("\n--- [2] ENV VARIABLES ---")
required_vars = ["GROQ_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET_NAME", "MONGO_URI", "DB_NAME"]
env_ok = True
for var in required_vars:
    val = os.getenv(var)
    if val:
        masked = val[:6] + "..." if len(val) > 6 else val
        print(f"  [PASS] {var} = {masked}")
    else:
        print(f"  [FAIL] {var} — MISSING")
        env_ok = False

# 3. GROQ API call
print("\n--- [3] GROQ API LIVE TEST ---")
groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "Say: PREFLIGHT_OK"}],
            max_tokens=10
        )
        print(f"  [PASS] Groq API working. Response: {resp.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"  [FAIL] Groq API error: {e}")
else:
    print("  [SKIP] GROQ_API_KEY missing")

# 4. AWS S3
print("\n--- [4] AWS S3 ---")
aws_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION", "ap-south-1")
s3_bucket = os.getenv("S3_BUCKET_NAME")
if aws_key and aws_secret:
    try:
        import boto3
        s3 = boto3.client("s3", aws_access_key_id=aws_key, aws_secret_access_key=aws_secret, region_name=aws_region)
        s3.head_bucket(Bucket=s3_bucket)
        print(f"  [PASS] S3 bucket '{s3_bucket}' exists and accessible.")
    except Exception as e:
        print(f"  [FAIL] S3: {e}")
else:
    print("  [SKIP] AWS credentials missing")

# 5. Textract
print("\n--- [5] AWS TEXTRACT ---")
if aws_key and aws_secret:
    try:
        import boto3
        textract = boto3.client("textract", aws_access_key_id=aws_key, aws_secret_access_key=aws_secret, region_name=aws_region)
        # Harmless: list operations (no actual document call)
        _ = textract.meta.service_model.service_name
        print(f"  [PASS] Textract client initialized (region: {aws_region})")
    except Exception as e:
        print(f"  [FAIL] Textract: {e}")
else:
    print("  [SKIP] AWS credentials missing")

# 6. Bedrock
print("\n--- [6] AWS BEDROCK ---")
if aws_key and aws_secret:
    try:
        import boto3
        bedrock = boto3.client("bedrock", aws_access_key_id=aws_key, aws_secret_access_key=aws_secret, region_name=aws_region)
        models = bedrock.list_foundation_models()
        count = len(models.get("modelSummaries", []))
        print(f"  [PASS] Bedrock accessible. {count} foundation models found.")
    except Exception as e:
        print(f"  [FAIL] Bedrock: {e}")
else:
    print("  [SKIP] AWS credentials missing")

# 7. MongoDB
print("\n--- [7] MONGODB ATLAS ---")
async def check_mongo():
    try:
        import certifi
        from motor.motor_asyncio import AsyncIOMotorClient
        mongo_uri = os.getenv("MONGO_URI")
        db_name = os.getenv("DB_NAME", "hireflow")
        client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=8000)
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"  [PASS] MongoDB Atlas connected. DB: '{db_name}', Collections: {collections}")
    except Exception as e:
        print(f"  [FAIL] MongoDB: {e}")

asyncio.run(check_mongo())

print("\n=== PRE-FLIGHT COMPLETE ===")
