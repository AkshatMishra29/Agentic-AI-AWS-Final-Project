
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

mongo_uri = os.getenv("MONGO_URI") or "mongodb://localhost:27017"
db_name = os.getenv("DB_NAME") or "hireflow"

client = AsyncIOMotorClient(mongo_uri, tlsCAFile=certifi.where())
db = client[db_name]

async def create_db_indexes():
    """Ensure indexes on high-frequency query collections safely."""
    try:
        await db.users.create_index("email", unique=True)
        await db.applications.create_index([("candidate_id", 1), ("job_id", 1)])
        await db.jobs.create_index("created_at")
        await db.notifications.create_index([("user_id", 1), ("read", 1)])
    except Exception as e:
        print(f"[DB Indexing Warning]: {e}")
