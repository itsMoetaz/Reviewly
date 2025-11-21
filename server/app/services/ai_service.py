import json
import re
import time
from typing import Dict, List, Optional

from groq import Groq

from app.config.settings import settings
from app.core.logging_config import security_logger


class MultiKeyGroqService:
    def __init__(self, api_keys: List[str]):
        if not api_keys:
            raise ValueError("At least one Groq API key is required")

        self.api_keys = api_keys
        self.clients = [Groq(api_key=key) for key in api_keys]
        self.current_key_index = 0
        self.key_last_used = {}
        self.key_cooldown = 60

        security_logger.info(f"Initialized Groq AI service with {len(api_keys)} API keys")

    def _get_next_client(self) -> tuple:
        """Get next available client using round-robin with cooldown"""
        attempts = 0
        while attempts < len(self.clients):
            idx = (self.current_key_index + attempts) % len(self.clients)
            last_used = self.key_last_used.get(idx, 0)

            if time.time() - last_used > self.key_cooldown:
                self.current_key_index = (idx + 1) % len(self.clients)
                self.key_last_used[idx] = time.time()
                security_logger.info(f"Using Groq API key #{idx + 1}")
                return self.clients[idx], idx

            attempts += 1

        security_logger.warning("All API keys in cooldown, using key #1")
        idx = 0
        self.key_last_used[idx] = time.time()
        return self.clients[idx], idx

    async def analyze_code(
        self, pr_diff: str, pr_details: Dict, file_contents: Optional[Dict[str, str]] = None
    ) -> Dict:

        prompt = self._build_prompt(pr_diff, pr_details, file_contents)

        for attempt in range(len(self.clients)):
            try:
                client, key_index = self._get_next_client()

                security_logger.info(f"Calling Groq AI (attempt {attempt + 1}/{len(self.clients)})")

                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": self._get_system_prompt()},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=settings.AI_MAX_TOKENS,
                    timeout=settings.AI_TIMEOUT,
                )

                content = response.choices[0].message.content
                tokens_used = response.usage.total_tokens

                result = self._parse_response(content)
                result["tokens_used"] = tokens_used
                result["api_key_used"] = key_index + 1

                security_logger.info(
                    f"AI analysis successful: {len(result['issues'])} issues found, " f"{tokens_used} tokens used"
                )
                return result

            except Exception as e:
                security_logger.error(f"Groq API error with key #{key_index + 1}: {e}")
                if attempt == len(self.clients) - 1:
                    raise Exception(f"All {len(self.clients)} API keys failed. Last error: {str(e)}")
                continue

        raise Exception("All API keys failed")

    def _get_system_prompt(self) -> str:
        return """You are an expert code reviewer. Analyze code changes and identify:

1. **Security issues**: SQL injection, XSS, authentication bypass, exposed secrets, CSRF, insecure dependencies
2. **Bugs**: Null/undefined errors, race conditions, logic errors, edge case failures, type mismatches
3. **Performance**: N+1 queries, inefficient algorithms, memory leaks, unnecessary computations
4. **Code quality**: Poor naming, code duplication, high complexity, missing error handling
5. **Best practices**: Framework violations, language anti-patterns, missing validation
6. **Documentation**: Missing docstrings, unclear comments, outdated documentation
7. **Testing**: Insufficient test coverage, missing edge case tests

For EACH issue found, provide:
- `file`: File path relative to repo root
- `line`: Line number where issue starts (or null if file-wide)
- `severity`: Must be one of: "critical", "high", "medium", "low", "info"
- `category`: Must be one of: "security", "bug", "performance", "code_quality",
                              "best_practices", "documentation", "testing"
- `title`: Brief 1-line summary (max 100 chars)
- `description`: Detailed explanation of the issue and why it matters
- `suggestion`: Concrete, actionable fix recommendation

Provide overall assessment:
- `summary`: Comprehensive 2-3 paragraph overview of all changes and key concerns
- `rating`: Must be one of: "LGTM" (no significant issues), "Needs Work" (minor improvements),
                            "Major Issues" (critical problems)

**CRITICAL**: Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON:
{
  "summary": "Overall assessment text here...",
  "rating": "LGTM",
  "issues": [
    {
      "file": "path/to/file.py",
      "line": 42,
      "severity": "high",
      "category": "bug",
      "title": "Potential null pointer exception",
      "description": "The variable 'user' might be null when accessed...",
      "suggestion": "Add null check: if user is not None:..."
    }
  ]
}"""

    def _build_prompt(self, pr_diff: str, pr_details: Dict, file_contents: Optional[Dict] = None) -> str:

        title = pr_details.get("title", "N/A")
        description = pr_details.get("description", pr_details.get("body", "N/A"))
        author = pr_details.get("author", {})
        if isinstance(author, dict):
            author_name = author.get("username", author.get("login", "N/A"))
        else:
            author_name = "N/A"

        files_changed = len(pr_details.get("files", []))

        prompt = f"""Review this pull request:

**Title**: {title}
**Description**: {description or 'No description provided'}
**Author**: {author_name}
**Files Changed**: {files_changed}

**Code Changes**:
```diff
{pr_diff[:settings.MAX_DIFF_SIZE]}
```
"""

        if file_contents:
            prompt += "\n**Full File Context** (for reference):\n"
            for path, content in list(file_contents.items())[: settings.MAX_FILES_CONTEXT]:
                prompt += f"\n**{path}**:\n```\n{content[:settings.MAX_FILE_CONTENT_SIZE]}\n```\n"

        prompt += "\nAnalyze the changes thoroughly and provide your code review as JSON."
        return prompt

    def _parse_response(self, response: str) -> Dict:
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response, re.DOTALL)
        if json_match:
            response = json_match.group(1)

        response = response.strip()

        try:
            data = json.loads(response)

            if not isinstance(data, dict):
                raise ValueError("Response is not a JSON object")

            return {
                "summary": data.get("summary", "No summary provided"),
                "rating": data.get("rating", "Needs Work"),
                "issues": data.get("issues", []),
                "tokens_used": 0,
            }

        except json.JSONDecodeError as e:
            security_logger.error(f"Failed to parse AI response as JSON: {e}")
            security_logger.debug(f"Response was: {response[:500]}")

            return {
                "summary": response[:1000] if len(response) > 1000 else response,
                "rating": "Needs Work",
                "issues": [],
                "tokens_used": 0,
            }


def get_ai_service() -> MultiKeyGroqService:
    api_keys = settings.groq_api_keys_list
    if not api_keys:
        raise ValueError(
            "No Groq API keys configured. Please set GROQ_API_KEYS in .env file. "
            "Get free API keys from https://console.groq.com"
        )
    return MultiKeyGroqService(api_keys=api_keys)
