from typing import List, Dict, Optional, Any
import requests
from fastapi import HTTPException, status
from app.core.logging_config import security_logger
from app.services.cache_service import cache_service


class GitHubAPIError(Exception):
    pass


def _make_github_request(
    endpoint: str,
    token: str,
    params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    base_url = "https://api.github.com"
    url = f"{base_url}{endpoint}"
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CodeReview-App"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        rate_limit_remaining = response.headers.get('X-RateLimit-Remaining')
        rate_limit_reset = response.headers.get('X-RateLimit-Reset')
        security_logger.info(
            f"GitHub API: {endpoint} | Rate limit remaining: {rate_limit_remaining}"
        )
        
        if response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired GitHub token"
            )
        elif response.status_code == 403:
            if rate_limit_remaining == '0':
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"GitHub API rate limit exceeded. Resets at {rate_limit_reset}"
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden. Check token permissions."
            )
        elif response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found on GitHub"
            )
        elif response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"GitHub API error: {response.status_code}"
            )
        
        return response.json()
    
    except requests.RequestException as e:
        security_logger.error(f"GitHub API request failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to connect to GitHub API"
        )


def fetch_branches(token: str, owner: str, repo: str) -> List[Dict[str, Any]]:
    cached = cache_service.get("github:branches", owner=owner, repo=repo)
    if cached:
        return cached
    
    security_logger.info(f"[CACHE MISS] Fetching branches from {owner}/{repo}")
    endpoint = f"/repos/{owner}/{repo}/branches"
    branches_data = _make_github_request(endpoint, token)
    branches = []
    for branch in branches_data:
        branches.append({
            "name": branch["name"],
            "commit": {
                "sha": branch["commit"]["sha"],
                "url": branch["commit"]["url"]
            },
            "protected": branch.get("protected", False)
        })
    
    cache_service.set("github:branches", branches, ttl=300, owner=owner, repo=repo)
    security_logger.info(f"Fetched {len(branches)} branches from {owner}/{repo}")
    return branches


def fetch_pull_requests(
    token: str,
    owner: str,
    repo: str,
    state: str = "open",
    page: int = 1,
    per_page: int = 20
) -> Dict[str, Any]:
    cached = cache_service.get("github:prs", owner=owner, repo=repo, state=state, page=page, per_page=per_page)
    if cached:
        return cached
    
    security_logger.info(f"[CACHE MISS] Fetching PRs from {owner}/{repo} (state={state})")

    endpoint = f"/repos/{owner}/{repo}/pulls"
    params = {
        "state": state,
        "page": page,
        "per_page": min(per_page, 100)  
    }
    
    prs_data = _make_github_request(endpoint, token, params)
    pull_requests = []
    for pr in prs_data:
        pull_requests.append({
            "number": pr["number"],
            "title": pr["title"],
            "state": pr["state"],
            "author": pr["user"]["login"],
            "author_avatar": pr["user"]["avatar_url"],
            "source_branch": pr["head"]["ref"],
            "target_branch": pr["base"]["ref"],
            "created_at": pr["created_at"],
            "updated_at": pr["updated_at"],
            "comments_count": pr.get("comments", 0),
            "commits_count": pr.get("commits", None),
            "changed_files_count": pr.get("changed_files", None),
            "additions": pr.get("additions", None),
            "deletions": pr.get("deletions", None)
        })
    
    security_logger.info(f"Fetched {len(pull_requests)} PRs from {owner}/{repo}")
    
    result = {
        "pull_requests": pull_requests,
        "page": page,
        "per_page": per_page,
        "total": len(pull_requests)  
    }
    
    ttl = 120 if state == "open" else 300
    cache_service.set("github:prs", result, ttl=ttl, owner=owner, repo=repo, state=state, page=page, per_page=per_page)
    
    return result


def fetch_pull_request_details(
    token: str,
    owner: str,
    repo: str,
    pr_number: int
) -> Dict[str, Any]:
    cached = cache_service.get("github:pr_details", owner=owner, repo=repo, pr_number=pr_number)
    if cached:
        return cached
    
    security_logger.info(f"[CACHE MISS] Fetching PR #{pr_number} details from {owner}/{repo}")

    pr_endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}"
    pr_data = _make_github_request(pr_endpoint, token)

    commits_endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}/commits"
    commits_data = _make_github_request(commits_endpoint, token)

    files_endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}/files"
    files_data = _make_github_request(files_endpoint, token)
    
    commits = []
    for commit in commits_data:
        commits.append({
            "sha": commit["sha"],
            "message": commit["commit"]["message"],
            "author": commit["commit"]["author"]["name"],
            "date": commit["commit"]["author"]["date"]
        })
    
    files = []
    total_additions = 0
    total_deletions = 0
    
    for file in files_data:
        files.append({
            "filename": file["filename"],
            "status": file["status"],  
            "additions": file["additions"],
            "deletions": file["deletions"],
            "changes": file["changes"],
            "patch": file.get("patch", "")  
        })
        total_additions += file["additions"]
        total_deletions += file["deletions"]
    
    pr_details = {
        "number": pr_data["number"],
        "title": pr_data["title"],
        "description": pr_data["body"] or "",
        "state": pr_data["state"],
        "author": {
            "username": pr_data["user"]["login"],
            "avatar_url": pr_data["user"]["avatar_url"]
        },
        "source_branch": pr_data["head"]["ref"],
        "target_branch": pr_data["base"]["ref"],
        "created_at": pr_data["created_at"],
        "updated_at": pr_data["updated_at"],
        "merged_at": pr_data.get("merged_at"),
        "mergeable": pr_data.get("mergeable"),
        "commits": commits,
        "files": files,
        "stats": {
            "total_commits": len(commits),
            "total_additions": total_additions,
            "total_deletions": total_deletions,
            "total_changes": total_additions + total_deletions,
            "changed_files": len(files)
        }
    }
    
    cache_service.set("github:pr_details", pr_details, ttl=180, owner=owner, repo=repo, pr_number=pr_number)
    security_logger.info(f"Fetched PR #{pr_number} details from {owner}/{repo}")
    return pr_details


def fetch_file_content(
    token: str,
    owner: str,
    repo: str,
    file_path: str,
    branch: str = "main"
) -> Dict[str, Any]:
    cached = cache_service.get("github:file_content", owner=owner, repo=repo, file_path=file_path, branch=branch)
    if cached:
        return cached
    
    security_logger.info(f"[CACHE MISS] Fetching file content: {file_path} from {owner}/{repo}@{branch}")

    endpoint = f"/repos/{owner}/{repo}/contents/{file_path}"
    params = {"ref": branch}
    
    file_data = _make_github_request(endpoint, token, params)

    file_info = {
        "path": file_data["path"],
        "name": file_data["name"],
        "size": file_data["size"],
        "sha": file_data["sha"],
        "encoding": file_data["encoding"],  
        "content": file_data["content"],  
        "branch": branch,
        "download_url": file_data.get("download_url")
    }
    
    cache_service.set("github:file_content", file_info, ttl=600, owner=owner, repo=repo, file_path=file_path, branch=branch)
    security_logger.info(f"Fetched file content: {file_path} from {owner}/{repo}@{branch}")
    return file_info


def fetch_file_diff(
    token: str,
    owner: str,
    repo: str,
    pr_number: int,
    file_path: str
) -> Dict[str, Any]:
    cached = cache_service.get("github:file_diff", owner=owner, repo=repo, pr_number=pr_number, file_path=file_path)
    if cached:
        return cached
    
    security_logger.info(f"[CACHE MISS] Fetching diff for {file_path} in PR #{pr_number} from {owner}/{repo}")

    files_endpoint = f"/repos/{owner}/{repo}/pulls/{pr_number}/files"
    files_data = _make_github_request(files_endpoint, token)
    
    target_file = None
    for file in files_data:
        if file["filename"] == file_path:
            target_file = file
            break
    
    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_path}' not found in PR #{pr_number}"
        )
    
    file_diff = {
        "path": target_file["filename"],
        "status": target_file["status"],
        "additions": target_file["additions"],
        "deletions": target_file["deletions"],
        "changes": target_file["changes"],
        "patch": target_file.get("patch", ""),  
        "previous_filename": target_file.get("previous_filename") 
    }
    
    cache_service.set("github:file_diff", file_diff, ttl=300, owner=owner, repo=repo, pr_number=pr_number, file_path=file_path)
    security_logger.info(f"Fetched diff for {file_path} in PR #{pr_number} from {owner}/{repo}")
    return file_diff
