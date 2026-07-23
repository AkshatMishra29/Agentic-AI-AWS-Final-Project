import os
import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

GROQ_MODEL = "llama-3.3-70b-versatile"
BEDROCK_MODEL = "amazon.nova-lite-v1:0"


def call_groq(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
    """Call Groq LLM (primary). Returns the raw text response."""
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=4096,
    )
    return resp.choices[0].message.content.strip(), GROQ_MODEL, resp.usage.total_tokens if resp.usage else 0


def call_bedrock(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
    """Call AWS Bedrock Nova Lite (fallback). Returns the raw text response."""
    import boto3
    client = boto3.client(
        "bedrock-runtime",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )
    body = {
        "messages": [
            {"role": "user", "content": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
        ],
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": 4096,
        }
    }
    response = client.invoke_model(
        modelId=BEDROCK_MODEL,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(response["body"].read())
    text = result["output"]["message"]["content"][0]["text"]
    tokens = result.get("usage", {}).get("totalTokens", 0)
    return text.strip(), BEDROCK_MODEL, tokens


def llm_call(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> tuple[str, str, int]:
    """
    Primary: Groq. Falls back to Bedrock if Groq fails.
    Returns (response_text, model_used, tokens_used)
    """
    try:
        return call_groq(system_prompt, user_prompt, temperature)
    except Exception as groq_error:
        print(f"[LLM] Groq failed ({groq_error}), falling back to Bedrock...")
        try:
            return call_bedrock(system_prompt, user_prompt, temperature)
        except Exception as bedrock_error:
            raise RuntimeError(
                f"Both LLM providers failed.\nGroq: {groq_error}\nBedrock: {bedrock_error}"
            )


def parse_json_from_llm(response_text: str) -> dict:
    """Extract JSON block from LLM response, handling markdown code fences."""
    text = response_text.strip()
    # Strip ```json ... ``` fences
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return json.loads(text)
