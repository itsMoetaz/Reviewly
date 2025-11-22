from typing import Any, Dict, List, Optional

import requests
from fastapi import HTTPException, status

from app.core.logging_config import security_logger
from app.services.cache_service import cache_service


class GitLabAPIError(Exception):
    pass


def _make_gitlab_request(endpoint: str, token: str, params: Optional[Dict[str, Any]] = None) -> Any:

    base_url = "https://gitlab.com/api/v4"
    url = f"{base_url}{endpoint}"

    headers = {"Authorization": f"Bearer {token}", "User-Agent": "CodeReview-App"}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)

        rate_limit_remaining = response.headers.get("RateLimit-Remaining")
        rate_limit_reset = response.headers.get("RateLimit-Reset")
        security_logger.info(f"GitLab API: {endpoint} | Rate limit remaining: {rate_limit_remaining}")

        if response.status_code == 401:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired GitLab token")
        elif response.status_code == 403:
            if rate_limit_remaining == "0":
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"GitLab API rate limit exceeded. Resets at {rate_limit_reset}",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden. Check token permissions."
            )
        elif response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found on GitLab")
        elif response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"GitLab API error: {response.status_code}"
            )

        return response.json()

    except requests.RequestException as e:
        security_logger.error(f"GitLab API request failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to connect to GitLab API")


def _make_gitlab_post_request(endpoint: str, token: str, data: Dict[str, Any]) -> Dict[str, Any]:
    base_url = "https://gitlab.com/api/v4"
    url = f"{base_url}{endpoint}"

    headers = {"Authorization": f"Bearer {token}", "User-Agent": "CodeReview-App"}

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)

        if response.status_code == 401:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired GitLab token")
        elif response.status_code == 403:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden. Check token permissions."
            )
        elif response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found on GitLab")
        elif response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"GitLab API error: {response.status_code}"
            )

        return response.json()

    except requests.RequestException as e:
        security_logger.error(f"GitLab API POST request failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to connect to GitLab API")


def create_mr_comment(token: str, project_id: str, mr_iid: int, comment_body: str) -> Dict[str, Any]:
    project_id_encoded = project_id.replace("/", "%2F")
    endpoint = f"/projects/{project_id_encoded}/merge_requests/{mr_iid}/notes"
    payload = {"body": comment_body}
    response = _make_gitlab_post_request(endpoint, token, data=payload)

    return {"note_id": response["id"], "web_url": response.get("web_url"), "created_at": response["created_at"]}


def fetch_branches(token: str, project_id: str) -> List[Dict[str, Any]]:
    cached = cache_service.get("gitlab:branches", project_id=project_id)
    if cached:
        return cached

    security_logger.info(f"[CACHE MISS] Fetching branches from GitLab project {project_id}")
    endpoint = f"/projects/{project_id.replace('/', '%2F')}/repository/branches"
    branches_data = _make_gitlab_request(endpoint, token)

    branches = []
    for branch in branches_data:
        branches.append(
            {
                "name": branch["name"],
                "commit": {
                    "sha": branch["commit"]["id"],
                    "message": branch["commit"]["message"],
                    "author": branch["commit"]["author_name"],
                    "date": branch["commit"]["created_at"],
                },
                "protected": branch.get("protected", False),
            }
        )

    cache_service.set("gitlab:branches", branches, ttl=300, project_id=project_id)
    security_logger.info(f"Fetched {len(branches)} branches from GitLab project {project_id}")
    return branches


def fetch_merge_requests(
    token: str, project_id: str, state: str = "opened", page: int = 1, per_page: int = 20
) -> Dict[str, Any]:
    cached = cache_service.get("gitlab:mrs", project_id=project_id, state=state, page=page, per_page=per_page)
    if cached:
        return cached

    security_logger.info(f"[CACHE MISS] Fetching MRs from GitLab project {project_id} (state={state})")

    endpoint = f"/projects/{project_id.replace('/', '%2F')}/merge_requests"
    params = {"state": state, "page": page, "per_page": min(per_page, 100)}

    mrs_data = _make_gitlab_request(endpoint, token, params)

    merge_requests = []
    for mr in mrs_data:
        merge_requests.append(
            {
                "number": mr["iid"],
                "title": mr["title"],
                "state": mr["state"],
                "author": mr["author"]["username"],
                "author_avatar": mr["author"]["avatar_url"],
                "source_branch": mr["source_branch"],
                "target_branch": mr["target_branch"],
                "created_at": mr["created_at"],
                "updated_at": mr["updated_at"],
                "comments_count": mr.get("user_notes_count", 0),
                "upvotes": mr.get("upvotes", 0),
                "downvotes": mr.get("downvotes", 0),
                "work_in_progress": mr.get("work_in_progress", False),
            }
        )

    security_logger.info(f"Fetched {len(merge_requests)} MRs from GitLab project {project_id}")

    result = {"merge_requests": merge_requests, "page": page, "per_page": per_page, "total": len(merge_requests)}

    ttl = 120 if state == "opened" else 300
    cache_service.set("gitlab:mrs", result, ttl=ttl, project_id=project_id, state=state, page=page, per_page=per_page)

    return result


def fetch_merge_request_details(token: str, project_id: str, mr_iid: int) -> Dict[str, Any]:
    cached = cache_service.get("gitlab:mr_details", project_id=project_id, mr_iid=mr_iid)
    if cached:
        return cached

    security_logger.info(f"[CACHE MISS] Fetching MR !{mr_iid} details from GitLab project {project_id}")

    mr_endpoint = f"/projects/{project_id.replace('/', '%2F')}/merge_requests/{mr_iid}"
    mr_data = _make_gitlab_request(mr_endpoint, token)

    commits_endpoint = f"/projects/{project_id.replace('/', '%2F')}/merge_requests/{mr_iid}/commits"
    commits_data = _make_gitlab_request(commits_endpoint, token)

    changes_endpoint = f"/projects/{project_id.replace('/', '%2F')}/merge_requests/{mr_iid}/changes"
    changes_data = _make_gitlab_request(changes_endpoint, token)

    commits = []
    for commit in commits_data:
        commits.append(
            {
                "sha": commit["id"],
                "message": commit["message"],
                "author": commit["author_name"],
                "date": commit["created_at"],
            }
        )

    files = []
    total_additions = 0
    total_deletions = 0

    for change in changes_data.get("changes", []):
        diff_lines = change.get("diff", "").split("\n")
        additions = sum(1 for line in diff_lines if line.startswith("+") and not line.startswith("+++"))
        deletions = sum(1 for line in diff_lines if line.startswith("-") and not line.startswith("---"))

        files.append(
            {
                "filename": change["new_path"],
                "status": (
                    "renamed"
                    if change["renamed_file"]
                    else ("deleted" if change["deleted_file"] else ("added" if change["new_file"] else "modified"))
                ),
                "additions": additions,
                "deletions": deletions,
                "changes": additions + deletions,
                "diff": change.get("diff", ""),
            }
        )
        total_additions += additions
        total_deletions += deletions

    mr_details = {
        "number": mr_data["iid"],
        "title": mr_data["title"],
        "description": mr_data["description"] or "",
        "state": mr_data["state"],
        "author": {"username": mr_data["author"]["username"], "avatar_url": mr_data["author"]["avatar_url"]},
        "source_branch": mr_data["source_branch"],
        "target_branch": mr_data["target_branch"],
        "created_at": mr_data["created_at"],
        "updated_at": mr_data["updated_at"],
        "merged_at": mr_data.get("merged_at"),
        "mergeable": not mr_data.get("has_conflicts", False),
        "work_in_progress": mr_data.get("work_in_progress", False),
        "commits": commits,
        "files": files,
        "stats": {
            "total_commits": len(commits),
            "total_additions": total_additions,
            "total_deletions": total_deletions,
            "total_changes": total_additions + total_deletions,
            "changed_files": len(files),
        },
    }

    cache_service.set("gitlab:mr_details", mr_details, ttl=180, project_id=project_id, mr_iid=mr_iid)
    security_logger.info(f"Fetched MR !{mr_iid} details from GitLab project {project_id}")
    return mr_details


def fetch_file_content(token: str, project_id: str, file_path: str, branch: str = "main") -> Dict[str, Any]:
    cached = cache_service.get("gitlab:file_content", project_id=project_id, file_path=file_path, branch=branch)
    if cached:
        return cached

    security_logger.info(f"[CACHE MISS] Fetching file content: {file_path} from GitLab project {project_id}@{branch}")

    encoded_path = file_path.replace("/", "%2F")
    endpoint = f"/projects/{project_id.replace('/', '%2F')}/repository/files/{encoded_path}"
    params = {"ref": branch}

    file_data = _make_gitlab_request(endpoint, token, params)

    file_info = {
        "path": file_data["file_path"],
        "name": file_data["file_name"],
        "size": file_data["size"],
        "sha": file_data["blob_id"],
        "encoding": file_data["encoding"],
        "content": file_data["content"],
        "branch": branch,
    }

    cache_service.set(
        "gitlab:file_content", file_info, ttl=600, project_id=project_id, file_path=file_path, branch=branch
    )
    security_logger.info(f"Fetched file content: {file_path} from GitLab project {project_id}@{branch}")
    return file_info


def fetch_file_diff(token: str, project_id: str, mr_iid: int, file_path: str) -> Dict[str, Any]:
    cached = cache_service.get("gitlab:file_diff", project_id=project_id, mr_iid=mr_iid, file_path=file_path)
    if cached:
        return cached

    security_logger.info(f"[CACHE MISS] Fetching diff for {file_path} in MR !{mr_iid} from GitLab project {project_id}")

    changes_endpoint = f"/projects/{project_id.replace('/', '%2F')}/merge_requests/{mr_iid}/changes"
    changes_data = _make_gitlab_request(changes_endpoint, token)

    target_file = None
    for change in changes_data.get("changes", []):
        if change["new_path"] == file_path or change["old_path"] == file_path:
            target_file = change
            break

    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"File '{file_path}' not found in MR !{mr_iid}"
        )

    diff_lines = target_file.get("diff", "").split("\n")
    additions = sum(1 for line in diff_lines if line.startswith("+") and not line.startswith("+++"))
    deletions = sum(1 for line in diff_lines if line.startswith("-") and not line.startswith("---"))

    file_diff = {
        "path": target_file["new_path"],
        "status": (
            "renamed"
            if target_file["renamed_file"]
            else ("deleted" if target_file["deleted_file"] else ("added" if target_file["new_file"] else "modified"))
        ),
        "additions": additions,
        "deletions": deletions,
        "changes": additions + deletions,
        "diff": target_file.get("diff", ""),
        "previous_path": target_file.get("old_path") if target_file["renamed_file"] else None,
    }

    cache_service.set("gitlab:file_diff", file_diff, ttl=300, project_id=project_id, mr_iid=mr_iid, file_path=file_path)
    security_logger.info(f"Fetched diff for {file_path} in MR !{mr_iid} from GitLab project {project_id}")
    return file_diff
