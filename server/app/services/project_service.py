from typing import List, Optional
from sqlalchemy.orm import Session
import requests

def verify_github_token(token: str, owner: str, repo: str) -> bool:
    try:
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        response = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def verify_gitlab_token(token: str, project_id: int) -> bool:
    try:
        headers = {
            "Authorization": f"Bearer {token}",
        }
        response = requests.get(f"https://gitlab.com/api/v4/projects/{project_id}", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception:
        return False
    