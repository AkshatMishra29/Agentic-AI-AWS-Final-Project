import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')

from database import db
from auth import hash_password

async def seed_admin():
    admin_email = "admin@hireflow.com"
    admin_password = "adminpass123"
    admin_name = "Super Admin"

    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"[Seed Admin] Admin account '{admin_email}' already exists.")
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"role": "admin", "password": hash_password(admin_password), "name": admin_name, "is_active": True}}
        )
        print(f"[Seed Admin] Updated admin account password to: {admin_password}")
    else:
        user_doc = {
            "name": admin_name,
            "email": admin_email,
            "password": hash_password(admin_password),
            "role": "admin",
            "is_active": True
        }
        await db.users.insert_one(user_doc)
        print(f"[Seed Admin] Successfully created Super Admin account!")

    print(f"\n==========================================")
    print(f"       ADMIN CREDENTIALS GENERATED        ")
    print(f"==========================================")
    print(f" Email:    admin@hireflow.com")
    print(f" Password: adminpass123")
    print(f" Role:     admin")
    print(f"==========================================\n")

if __name__ == "__main__":
    asyncio.run(seed_admin())
