# CodeReview API - User Documentation

**AI-Powered Code Review Platform for GitHub & GitLab**

Version: 1.0.0  
Base URL: `http://localhost:8000`

---

## 🚀 Quick Start

### 1. **Setup & Run**

```bash
# Clone repository
cd server

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
alembic upgrade head

# Start server
python run.py
```

Server runs on: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

### 2. **Environment Variables**

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# JWT
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI (Groq)
GROQ_API_KEY_1=gsk_your_key
GROQ_API_KEY_2=gsk_backup_key  # optional

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## 📚 Core Features

### 1. **Authentication**

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=SecurePass123!
```

**Response:** `{"access_token": "...", "token_type": "bearer"}`

**Use token in headers:** `Authorization: Bearer YOUR_TOKEN`

---

### 2. **Projects**

#### Create Project (GitHub)

```http
POST /api/projects
Authorization: Bearer TOKEN

{
  "name": "My Project",
  "description": "Project description",
  "platform": "github",
  "repository_url": "https://github.com/owner/repo",
  "github_token": "ghp_your_token",
  "github_repo_owner": "owner",
  "github_repo_name": "repo"
}
```

#### Create Project (GitLab)

```http
POST /api/projects

{
  "name": "My Project",
  "platform": "gitlab",
  "repository_url": "https://gitlab.com/group/project",
  "gitlab_token": "glpat_your_token",
  "gitlab_project_id": "12345"
}
```

#### List Projects

```http
GET /api/projects
Authorization: Bearer TOKEN
```

#### Update/Delete Project

```http
PUT /api/projects/{id}     # Admin+ only
DELETE /api/projects/{id}  # Owner only
```

---

### 3. **AI Code Reviews**

#### Trigger AI Review

```http
POST /ai-reviews/projects/{project_id}/pull-requests/{pr_number}
Authorization: Bearer TOKEN

{
  "include_context": true
}
```

**Features:**

- Security analysis
- Bug detection
- Performance issues
- Code quality suggestions
- Best practices

#### Get Review Details

```http
GET /ai-reviews/{review_id}
Authorization: Bearer TOKEN
```

**Response includes:**

- Overall rating & summary
- List of issues with severity
- File-by-file analysis
- Processing stats

#### List PR Reviews

```http
GET /ai-reviews/projects/{project_id}/pull-requests/{pr_number}
```

---

### 4. **Team Collaboration**

#### Invite Member

```http
POST /api/teams/projects/{project_id}/members/invite
Authorization: Bearer TOKEN

{
  "email": "member@example.com",
  "role": "REVIEWER"  # OWNER, ADMIN, REVIEWER
}
```

**Email sent automatically!**

#### List Members

```http
GET /api/teams/projects/{project_id}/members
```

#### Update Role / Remove Member

```http
PUT /api/teams/projects/{project_id}/members/{member_id}/role
DELETE /api/teams/projects/{project_id}/members/{member_id}
```

#### Accept Invitation

```http
POST /api/teams/invitations/{invitation_id}/accept
```

**Roles:**

- **OWNER**: Full control, can delete project
- **ADMIN**: Manage settings, invite members
- **REVIEWER**: Create reviews, add comments

---

### 5. **PR Comments & Reactions**

#### Add Comment

```http
POST /api/pr-comments
Authorization: Bearer TOKEN

{
  "project_id": 1,
  "pr_number": 123,
  "content": "Great work!",
  "file_path": "src/main.py",  # optional (inline)
  "line_number": 42            # optional (inline)
}
```

#### React to Comment

```http
POST /api/pr-comments/{comment_id}/reactions

{
  "reaction_type": "thumbs_up"
}
```

**Available reactions:**

- `thumbs_up` 👍
- `thumbs_down` 👎
- `heart` ❤️
- `laugh` 😄
- `confused` 😕
- `rocket` 🚀
- `eyes` 👀

#### List Comments

```http
GET /api/pr-comments/projects/{project_id}/pull-requests/{pr_number}
```

---

### 6. **Subscription & Quotas**

#### Check Usage

```http
GET /api/subscription/status
Authorization: Bearer TOKEN
```

**Response:**

```json
{
  "tier": "free",
  "ai_reviews": {
    "used": 5,
    "limit": 10,
    "percentage": 50
  },
  "resets_at": "2025-12-01 00:00:00"
}
```

#### View Plans

```http
GET /api/subscription/plans
```

**Plans:**

- **Free**: 10 AI reviews/month
- **Plus**: 100 AI reviews/month
- **Pro**: Unlimited reviews

#### Change Tier

```http
POST /api/subscription/change-tier
Authorization: Bearer TOKEN

{
  "tier": "plus"  # free, plus, pro
}
```

---

## 🔒 Permissions

| Action           | Owner | Admin | Reviewer |
| ---------------- | ----- | ----- | -------- |
| View project     | ✅    | ✅    | ✅       |
| Create AI review | ✅    | ✅    | ✅       |
| Add comments     | ✅    | ✅    | ✅       |
| Update project   | ✅    | ✅    | ❌       |
| Invite members   | ✅    | ✅    | ❌       |
| Delete project   | ✅    | ❌    | ❌       |

---

## 📊 Typical Workflow

### For Project Owner:

1. **Register & Login**
2. **Create Project** (connect GitHub/GitLab)
3. **Invite Team Members** (assign roles)
4. **Trigger AI Reviews** on Pull Requests
5. **Review & Comment** on findings
6. **Manage Subscription** as needed

### For Team Member:

1. **Receive Email Invitation**
2. **Accept Invitation** (or register if new)
3. **Access Shared Projects**
4. **Create AI Reviews** (within quota)
5. **Collaborate** via comments & reactions

---

## 🎯 Common Use Cases

### Use Case 1: Review a PR

```bash
# 1. Create project (once)
POST /api/projects {...}

# 2. Trigger review
POST /ai-reviews/projects/1/pull-requests/42 {"include_context": true}

# 3. Check results
GET /ai-reviews/{review_id}

# 4. Add comment on findings
POST /api/pr-comments {...}
```

### Use Case 2: Team Setup

```bash
# 1. Create project
POST /api/projects

# 2. Invite reviewers
POST /api/teams/projects/1/members/invite
{"email": "dev@team.com", "role": "REVIEWER"}

# 3. They receive email & accept
# 4. Team collaborates on reviews
```

### Use Case 3: Quota Management

```bash
# Check usage
GET /api/subscription/status

# If quota exceeded (402 error)
POST /api/subscription/change-tier {"tier": "plus"}

# Continue reviewing
```

---

## 🐛 Error Codes

| Code | Meaning        | Solution                                |
| ---- | -------------- | --------------------------------------- |
| 401  | Unauthorized   | Login & use valid token                 |
| 402  | Quota exceeded | Upgrade subscription tier               |
| 403  | Forbidden      | Check role permissions                  |
| 404  | Not found      | Verify IDs are correct                  |
| 409  | Conflict       | Already exists (e.g., duplicate review) |
| 500  | Server error   | Check logs, verify API keys             |

---

## 📧 Email Notifications

Automatic emails sent for:

- ✉️ Team invitations
- ✉️ Welcome messages
- ✉️ Password resets
- ✉️ Email verification 

Configure SMTP in `.env` to enable.

---

## 🔧 Advanced Features

### Rate Limiting

- 100 requests/minute per user
- Use `Retry-After` header if rate limited

### Caching

- AI reviews cached for 1 hour
- Automatic invalidation on updates

### Multi-Key Rotation

- Multiple Groq API keys rotate automatically
- High availability & increased rate limits

---

## 📝 API Response Formats

### Success Response

```json
{
  "id": 1,
  "status": "completed",
  "data": {...}
}
```

### Error Response

```json
{
  "detail": "Error message"
}
```

### Pagination _(future)_

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20
}
```

---

## 🚀 Best Practices

1. **API Keys**: Rotate GitHub/GitLab tokens regularly
2. **Quotas**: Monitor usage via `/subscription/status`
3. **Small PRs**: Review PRs < 500 lines for best results
4. **Team Roles**: Assign minimum necessary permissions
5. **Testing**: Test with small PRs before production use
6. **Caching**: Review same PR only when code changes
7. **Errors**: Always check logs at `logs/security.log`

---

## 🔍 Troubleshooting

**Review fails?**

- Check PR has actual code changes
- Verify Groq API key is valid
- Review logs for detailed errors

**Can't invite members?**

- Ensure SMTP configured
- Check user has ADMIN+ role
- Verify email format

**Quota issues?**

- Run `alembic upgrade head`
- Check database `usage_tracking` table
- Verify subscription tier in database

---

## 📚 Resources

- **API Docs**: `http://localhost:8000/docs` (Swagger)
- **Logs**: `server/logs/security.log`
- **Database**: PostgreSQL via `DATABASE_URL`
- **Support**: Check GitHub issues

---

**Built with:** FastAPI, PostgreSQL, Groq AI, SQLAlchemy  
**License:** MIT  
**Version:** 1.0.0

---

**Ready to start!** Follow Quick Start → Create Project → Trigger Review 🚀
