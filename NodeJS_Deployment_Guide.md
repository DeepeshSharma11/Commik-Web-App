# Node.js Express Full Deployment Guide (Start to End)

This guide documents the complete process of deploying a **Node.js (Express) Backend** to an AWS EC2 instance, alongside a **React Frontend** on Cloudflare Pages.

---

## 🏗 Architecture Overview

| Component | Hosted On | Subdomain | Technology |
|---|---|---|---|
| **Backend** | AWS EC2 (Ubuntu) | `api.yourdomain.com` | Docker + Node.js + Nginx + Certbot |
| **Frontend** | Cloudflare Pages | `app.yourdomain.com` | React + Vite |
| **CI/CD** | GitHub Actions | — | Auto-build & push to GHCR |

---

## Part 1: Backend Deployment (EC2 with Node.js)

### 1. The `Dockerfile`
Unlike Python, a Node.js backend requires `package.json`. Place this `Dockerfile` in your `backend/` folder:
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 8000
CMD ["node", "index.js"]
```

### 2. GitHub Actions Setup (`.github/workflows/deploy.yml`)
The workflow builds the Express Docker image and SSHs into EC2.

```yaml
name: Node.js CI/CD Pipeline
on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
    - uses: actions/checkout@v3
    - uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile
        push: true
        provenance: false
        tags: ghcr.io/${{ github.repository_owner }}/express-backend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
    - uses: appleboy/ssh-action@v0.1.6
      with:
        host: ${{ secrets.SERVER_IP }}
        username: ${{ secrets.USER }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker pull ghcr.io/${{ github.repository_owner }}/express-backend:latest
          docker stop express-backend || true
          docker rm express-backend || true
          docker run -d --name express-backend -p 8000:8000 \
            --env-file /home/${{ secrets.USER }}/.env \
            --restart unless-stopped \
            ghcr.io/${{ github.repository_owner }}/express-backend:latest
```

### 3. AWS EC2 Server Preparation
SSH into your Ubuntu EC2 and install dependencies:
```bash
sudo apt update -y
sudo apt install docker.io nginx certbot python3-certbot-nginx -y
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

### 4. Environment Variables (`~/.env`)
Create the `.env` file on the EC2 server. Node.js uses this file for `process.env`.
```bash
nano ~/.env
```
**Example Content:**
```env
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://app.yourdomain.com
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
```

### 5. Nginx Reverse Proxy & SSL (Certbot)
Configure Nginx to route traffic to the Express container.
```bash
sudo nano /etc/nginx/sites-available/api
```
**Nginx Configuration:**
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
**Enable site and install SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 6. GitHub Secrets Configuration
Add these in your Repo **Settings -> Secrets and variables -> Actions**:
- `SERVER_IP`: EC2 Public IP (`0.00.00.000`)
- `USER`: `ubuntu`
- `SSH_KEY`: The `.pem` file contents

---

## Part 2: Frontend Deployment (Cloudflare Pages)

### 1. Connecting GitHub to Cloudflare Pages
- Logged into Cloudflare Dashboard -> **Workers & Pages**.
- Created a new Pages project connected to the GitHub Repo.
- **Build Settings:**
  - Framework: React / Vite
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `frontend`

### 2. Setting up the Custom Subdomain
1. In the Cloudflare Pages project, went to the **Custom Domains** tab.
2. Clicked **Set up a custom domain** and entered `app.yourdomain.com`.
3. Cloudflare automatically generated the `CNAME` record in the DNS table.

### 3. Frontend Environment Variables
Inside Cloudflare Pages Settings -> **Environment variables** (Production), set:
- `VITE_API_URL` = `https://api.yourdomain.com`

---

## Common Debugging Commands

**Check if Express Container is Running:**
```bash
sudo docker ps -a
```

**View Node.js Console Logs (`console.log` errors):**
```bash
sudo docker logs express-backend
```

**Restart Node.js Container:**
```bash
sudo docker restart express-backend
```
