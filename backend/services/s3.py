import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")


_s3_client_instance = None

def get_s3_client():
    global _s3_client_instance
    if _s3_client_instance is None:
        _s3_client_instance = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
    return _s3_client_instance


def upload_file_to_s3(file_bytes: bytes, s3_key: str, content_type: str = "application/octet-stream") -> dict:
    """Upload bytes to S3. Returns dict with s3_key and public URL."""
    s3 = get_s3_client()
    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )
    url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    return {"s3_key": s3_key, "s3_url": url}


def get_presigned_url(s3_key: str, expiry_seconds: int = 3600) -> str:
    """Generate a pre-signed URL for temporary access to a private S3 object."""
    s3 = get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expiry_seconds,
    )
    return url


def download_file_from_s3(s3_key: str) -> bytes:
    """Download an object from S3 and return raw bytes."""
    s3 = get_s3_client()
    response = s3.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
    return response["Body"].read()


def delete_file_from_s3(s3_key: str) -> bool:
    """Delete a file from S3."""
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        return True
    except ClientError:
        return False
