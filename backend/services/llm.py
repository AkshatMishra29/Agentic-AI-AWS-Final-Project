import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

# List of Groq models in order of preference (if 70b hits rate limit, switch to instant/gemma)
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]


def call_groq(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> tuple[str, str, int]:
    """
    Call Groq API with automatic fallback across multiple models if rate limits (HTTP 429) occur.
    Returns (response_text, model_used, tokens_used).
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing from environment")

    client = Groq(api_key=GROQ_API_KEY)
    last_exception = None

    for model in GROQ_MODELS:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_completion_tokens=2048,
            )
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else 0
            print(f"[Groq] Success using model '{model}' ({tokens} tokens)")
            return text, model, tokens

        except Exception as e:
            last_exception = e
            err_msg = str(e)
            if "429" in err_msg or "rate_limit" in err_msg.lower() or "limit" in err_msg.lower():
                print(f"[Groq] Model '{model}' rate limited (429). Trying fallback model...")
                continue
            else:
                # Non-rate-limit error — try next model anyway
                print(f"[Groq] Model '{model}' error ({e}). Trying fallback model...")
                continue

    raise RuntimeError(f"All Groq models failed. Last error: {last_exception}")


def call_bedrock(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> tuple[str, str, int]:
    """Bedrock fallback kept intact for future use when AWS account model access is granted."""
    import boto3
    aws_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")
    client = boto3.client(
        "bedrock-runtime",
        aws_access_key_id=aws_key,
        aws_secret_access_key=aws_secret,
        region_name=AWS_REGION,
    )
    body = {
        "messages": [
            {"role": "user", "content": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
        ],
        "inferenceConfig": {"temperature": temperature, "maxTokens": 2048},
    }
    response = client.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    res_body = json.loads(response["body"].read())
    text = res_body["output"]["message"]["content"][0]["text"]
    tokens = res_body.get("usage", {}).get("totalTokens", 0)
    return text, "amazon.nova-lite-v1:0", tokens


def llm_call(system_prompt: str, user_prompt: str, temperature: float = 0.1) -> tuple[str, str, int]:
    """Primary: Groq with automatic multi-model fallback."""
    return call_groq(system_prompt, user_prompt, temperature)


def parse_json_from_llm(response_text: str) -> dict:
    """Extract JSON from LLM response robustly."""
    import re
    text = response_text.strip()

    # Strip markdown fences
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Replace smart/curly quotes
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2018', "'").replace('\u2019', "'")

    # Remove trailing commas
    text = re.sub(r',\s*([}\]])', r'\1', text)

    try:
        return json.loads(text)
    except Exception:
        pass

    # Find outermost { ... }
    try:
        start = text.index('{')
        depth, end = 0, -1
        for i, ch in enumerate(text[start:], start):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end > start:
            return json.loads(text[start:end + 1])
    except Exception:
        pass

    raise ValueError(f"Could not parse JSON from LLM response: {text[:200]}")
