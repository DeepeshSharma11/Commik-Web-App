# CommilK Full Deployment Guide (Start to End)

This guide documents the complete process of deploying the CommilK application. It covers both the **FastAPI Backend (EC2)** and the **React Frontend (Cloudflare Pages)**.

---

## 🏗 Architecture Overview

| Component | Hosted On | Subdomain | Technology |
|---|---|---|---|
| **Backend** | AWS EC2 (Ubuntu) | `commilk.focitech.in` | Docker + Nginx + Certbot |
| **Frontend** | Cloudflare Pages | `emilk.focitech.in` | React + Vite |
| **CI/CD** | GitHub Actions | — | Auto-build & push to GHCR |

---

## Part 1: Backend Deployment (EC2)

### 1. GitHub Actions Setup (`.github/workflows/deploy.yml`)
We created a pipeline that triggers on `git push origin main`.
- It builds the Docker image from `backend/DockerFile`.
- Pushes it to GitHub Container Registry (GHCR).
- SSHs into the EC2 instance to pull and run the container.

### 2. AWS EC2 Server Preparation
On your fresh Ubuntu instance, we ran the following to install required software:

```bash
# Update and install Docker & Nginx
sudo apt update -y
sudo apt install docker.io nginx certbot python3-certbot-nginx -y

# Enable Docker and grant permissions
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

### 3. Environment Variables (`~/.env`)
We created the `.env` file on the EC2 server to securely hold API keys without committing them to GitHub.

```bash
nano ~/.env
```
**Example Content:**
```env
ENVIRONMENT=production
ALLOWED_ORIGINS=https://emilk.focitech.in,http://localhost:5173
FRONTEND_URL=https://emilk.focitech.in
# ... (Supabase, Groq, Resend keys)
```

### 4. Nginx Reverse Proxy & SSL (Certbot)
We configured Nginx to route traffic from port 80 (HTTP) to port 8000 (FastAPI Docker Container).

```bash
sudo nano /etc/nginx/sites-available/commilk
```
**Nginx Configuration:**
```nginx
server {
    server_name commilk.focitech.in;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
**Enable site and install SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/commilk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d commilk.focitech.in
```
*(Cloudflare Note: Proxy status must be GREY (DNS Only) while running certbot).*

### 5. GitHub Secrets Configuration
In the GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**, we added:
- `SERVER_IP`: EC2 Public IP (`0.00.00.000`)
- `USER`: `ubuntu`
- `SSH_KEY`: The `.pem` file contents

**Pushing code to `main` now automatically updates the backend!**

---

## Part 2: Frontend Deployment (Cloudflare Pages)

### 1. Resolving TypeScript Errors
Cloudflare runs a strict build. We disabled unused variable checks in `frontend/tsconfig.app.json` to ensure the build passes:
```json
"compilerOptions": {
    "ignoreDeprecations": "6.0",
    "noUnusedLocals": false,
    "noUnusedParameters": false
}
```

### 2. Connecting GitHub to Cloudflare Pages
- Logged into Cloudflare Dashboard -> **Workers & Pages**.
- Created a new Pages project connected to the GitHub Repo.
- **Build Settings:**
  - Framework: React / Vite
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `frontend` *(Crucial so Cloudflare builds the correct folder)*

### 3. Setting up the Custom Subdomain (`emilk.focitech.in`)
1. In the Cloudflare Pages project, went to the **Custom Domains** tab.
2. Clicked **Set up a custom domain** and entered `emilk.focitech.in`.
3. Cloudflare automatically generated the `CNAME` record in the DNS table and provisioned the SSL certificate.

### 4. Frontend Environment Variables
Inside Cloudflare Pages Settings -> **Environment variables** (Production), we set:
- `VITE_API_URL` = `https://commilk.focitech.in/api/v1`

*(This links the React UI directly to the newly deployed EC2 backend).*

---

## Common Debugging Commands

**Check if Backend is Running:**
```bash
sudo docker ps -a
```

**View Backend Logs (e.g., if you get a 502 Bad Gateway):**
```bash
sudo docker logs commilk-backend
```

**Restart Backend Container Manually:**
```bash
sudo docker stop commilk-backend && sudo docker rm commilk-backend
sudo docker run -d --name commilk-backend -p 8000:8000 \
  --env-file ~/.env \
  --restart unless-stopped \
  ghcr.io/deepeshsharma11/commilk-backend:latest
```
