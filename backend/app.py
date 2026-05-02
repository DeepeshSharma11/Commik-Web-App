from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether, Preformatted
)
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.platypus.flowables import Flowable

W, H = A4

# ── Palette ───────────────────────────────────────────────────────────
DARK     = HexColor("#0F172A")
TEAL     = HexColor("#0D9488")
TEAL_LT  = HexColor("#CCFBF1")
BLUE     = HexColor("#1D4ED8")
BLUE_LT  = HexColor("#DBEAFE")
AMBER    = HexColor("#B45309")
AMBER_LT = HexColor("#FEF3C7")
RED      = HexColor("#B91C1C")
RED_LT   = HexColor("#FEE2E2")
GREEN    = HexColor("#15803D")
GREEN_LT = HexColor("#DCFCE7")
GRAY     = HexColor("#374151")
GRAY_LT  = HexColor("#F9FAFB")
GRAY_MD  = HexColor("#6B7280")
CODE_BG  = HexColor("#0F172A")
CODE_FG  = HexColor("#E2E8F0")
WHITE    = colors.white
BORDER   = HexColor("#E2E8F0")

PW = W - 40*mm   # printable width

# ── Paragraph Styles ─────────────────────────────────────────────────
H1S  = ParagraphStyle("H1S",  fontName="Helvetica-Bold",   fontSize=20, textColor=WHITE,    leading=26, spaceAfter=2)
H1SB = ParagraphStyle("H1SB", fontName="Helvetica",        fontSize=10, textColor=HexColor("#99F6E4"), leading=15, spaceAfter=0)
H2S  = ParagraphStyle("H2S",  fontName="Helvetica-Bold",   fontSize=13, textColor=DARK,     leading=18, spaceBefore=14, spaceAfter=5)
H3S  = ParagraphStyle("H3S",  fontName="Helvetica-Bold",   fontSize=10, textColor=TEAL,     leading=14, spaceBefore=10, spaceAfter=4)
BS   = ParagraphStyle("BS",   fontName="Helvetica",        fontSize=9,  textColor=GRAY,     leading=14, spaceAfter=4)
TIPS = ParagraphStyle("TIPS", fontName="Helvetica",        fontSize=8.5,textColor=GREEN,    leading=13, spaceAfter=3,
                       leftIndent=8, borderPadding=(4,6,4,6), backColor=GREEN_LT)
WRNS = ParagraphStyle("WRNS", fontName="Helvetica",        fontSize=8.5,textColor=AMBER,    leading=13, spaceAfter=3,
                       leftIndent=8, borderPadding=(4,6,4,6), backColor=AMBER_LT)
ERRS = ParagraphStyle("ERRS", fontName="Helvetica",        fontSize=8.5,textColor=RED,      leading=13, spaceAfter=3,
                       leftIndent=8, borderPadding=(4,6,4,6), backColor=RED_LT)
TBLS = ParagraphStyle("TBLS", fontName="Helvetica",        fontSize=8,  textColor=GRAY,     leading=11)
TBLH = ParagraphStyle("TBLH", fontName="Helvetica-Bold",   fontSize=8,  textColor=WHITE,    leading=11)
NUMS = ParagraphStyle("NUMS", fontName="Helvetica-Bold",   fontSize=9,  textColor=WHITE,    alignment=TA_CENTER, leading=12)
MONO = ParagraphStyle("MONO", fontName="Courier",          fontSize=8,  textColor=CODE_FG,  leading=12, spaceAfter=0)

# ── Helpers ──────────────────────────────────────────────────────────
def sp(n=6): return Spacer(1, n)
def hr(c=TEAL, t=0.5): return HRFlowable(width="100%", thickness=t, color=c, spaceAfter=6, spaceBefore=2)

def h2(t): return Paragraph(t, H2S)
def h3(t): return Paragraph(t, H3S)
def body(t): return Paragraph(t, BS)
def tip(t): return Paragraph(f"✓  TIP: {t}", TIPS)
def warn(t): return Paragraph(f"⚠  NOTE: {t}", WRNS)
def danger(t): return Paragraph(f"✗  IMPORTANT: {t}", ERRS)

def code(lines):
    """Properly formatted code block — each line on its own line"""
    rows = []
    for line in lines:
        rows.append([Paragraph(line, MONO)])
    t = Table(rows, colWidths=[PW])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CODE_BG),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (0,0),   8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
        ("TOPPADDING",    (0,1), (-1,-1), 1),
        ("BOTTOMPADDING", (0,0), (-1,-2), 1),
        ("ROUNDEDCORNERS",[6]),
        ("BOX", (0,0), (-1,-1), 0.5, HexColor("#1E3A5F")),
    ]))
    return t

def tbl(headers, rows, widths=None):
    if not widths:
        n = len(headers)
        widths = [PW/n]*n
    data = [[Paragraph(h, TBLH) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), TBLS) for c in r])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),  (-1,0),  DARK),
        ("ROWBACKGROUNDS",(0,1),  (-1,-1), [WHITE, GRAY_LT]),
        ("LINEBELOW",     (0,0),  (-1,-1), 0.3, BORDER),
        ("LEFTPADDING",   (0,0),  (-1,-1), 7),
        ("RIGHTPADDING",  (0,0),  (-1,-1), 7),
        ("TOPPADDING",    (0,0),  (-1,-1), 5),
        ("BOTTOMPADDING", (0,0),  (-1,-1), 5),
        ("VALIGN",        (0,0),  (-1,-1), "TOP"),
        ("BOX",           (0,0),  (-1,-1), 0.5, HexColor("#CBD5E1")),
    ]))
    return t

def steps(items):
    """items = list of (title, description)"""
    data = []
    for i, (title, desc) in enumerate(items, 1):
        num  = Paragraph(str(i), NUMS)
        head = Paragraph(f"<b>{title}</b>", ParagraphStyle("sh", fontName="Helvetica-Bold", fontSize=9, textColor=DARK, leading=13))
        d    = Paragraph(desc, BS) if desc else Spacer(1,2)
        data.append([num, head, d])
    t = Table(data, colWidths=[8*mm, 52*mm, PW - 62*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), TEAL),
        ("VALIGN",        (0,0), (-1,-1),"TOP"),
        ("LEFTPADDING",   (0,0), (-1,-1), 5),
        ("RIGHTPADDING",  (0,0), (-1,-1), 5),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("ROWBACKGROUNDS",(1,0), (-1,-1), [WHITE, GRAY_LT]),
        ("LINEBELOW",     (0,0), (-1,-2), 0.3, BORDER),
        ("BOX",           (0,0), (-1,-1), 0.5, HexColor("#CBD5E1")),
    ]))
    return t

def kv(rows, w1=55*mm):
    data = [[Paragraph(k, ParagraphStyle("kh", fontName="Helvetica-Bold", fontSize=8.5, textColor=DARK, leading=12)),
             Paragraph(v, TBLS)] for k,v in rows]
    t = Table(data, colWidths=[w1, PW - w1])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), GRAY_LT),
        ("LINEBELOW",     (0,0), (-1,-2), 0.3, BORDER),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("BOX",           (0,0), (-1,-1), 0.5, BORDER),
    ]))
    return t

def section_header(num, title, subtitle=""):
    banner = Table([
        [Paragraph(f"{num}. {title}", H2S)],
        [Paragraph(subtitle, BS)] if subtitle else [Spacer(1,1)],
    ], colWidths=[PW])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), TEAL_LT),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("TOPPADDING",    (0,0), (0,0),   8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
        ("LINEAFTER",     (0,0), (0,-1),  3, TEAL),
        ("LINEBEFORE",    (0,0), (0,-1),  3, TEAL),
    ]))
    return banner

# ── Header / Footer ──────────────────────────────────────────────────
def hf(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(20*mm, H-17*mm, PW, 8*mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(23*mm, H-12.5*mm, "EC2 Ubuntu — Backend Deployment Guide")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(W-22*mm, H-12.5*mm, "FastAPI (Python) + Node.js/Express | Docker + Nginx + CI/CD")
    canvas.setFillColor(GRAY_LT)
    canvas.rect(20*mm, 9*mm, PW, 6.5*mm, fill=1, stroke=0)
    canvas.setFillColor(GRAY_MD)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(23*mm, 12*mm, "Production-Ready Guide — Ubuntu 24.04 LTS")
    canvas.drawRightString(W-22*mm, 12*mm, f"Page {doc.page}")
    canvas.restoreState()

# ══════════════════════════════════════════════════════════════════════
# PAGES
# ══════════════════════════════════════════════════════════════════════

def cover():
    e = []
    banner = Table([
        [Paragraph("EC2 Ubuntu", H1S)],
        [Paragraph("Backend Deployment Guide", H1S)],
        [Spacer(1, 4)],
        [Paragraph("FastAPI (Python)  +  Node.js / Express", H1SB)],
        [Paragraph("Docker  ·  Nginx  ·  CI/CD  ·  SSL  ·  Debug  ·  Security", H1SB)],
    ], colWidths=[PW])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), DARK),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("TOPPADDING",    (0,0), (0,0),   20),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 20),
        ("TOPPADDING",    (0,1), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-2), 3),
    ]))
    e.append(banner)
    e.append(sp(12))

    e.append(tbl(
        ["Item", "Details"],
        [
            ["Target OS",     "Ubuntu 24.04 LTS on AWS EC2"],
            ["Backend 1",     "FastAPI — Python 3.11 + Uvicorn + Systemd"],
            ["Backend 2",     "Node.js 20 LTS / Express — PM2 process manager"],
            ["Container",     "Docker + Docker Compose"],
            ["Reverse Proxy", "Nginx (rate limiting + security headers)"],
            ["SSL",           "Let's Encrypt via Certbot — Free, auto-renews"],
            ["CI/CD",         "GitHub Actions / Jenkins / GitLab Runner"],
            ["Security",      "UFW firewall + Fail2Ban + SSH hardening"],
        ],
        widths=[42*mm, PW-42*mm]
    ))
    e.append(sp(10))

    e.append(Paragraph("Table of Contents", H2S))
    e.append(hr())
    toc_rows = [
        ["1",  "AWS EC2 Instance Launch",              "Security Group · Key Pair · Elastic IP"],
        ["2",  "Ubuntu Initial Server Setup",          "Updates · deploy user · swap memory"],
        ["3",  "Docker Install on Ubuntu",             "Official Docker CE + Compose plugin"],
        ["4",  "FastAPI — Complete Deployment",        "Dockerfile · Systemd · Docker Compose"],
        ["5",  "Node.js / Express — Complete Deploy",  "nvm · PM2 · Dockerfile · Deploy script"],
        ["6",  "Nginx + SSL Configuration",            "Reverse proxy · Let's Encrypt · Headers"],
        ["7",  "Docker Compose Files",                 "FastAPI + Node versions · Dev override"],
        ["8",  "GitHub Actions CI/CD",                 "Auto-deploy on git push to main"],
        ["9",  "Jenkins on EC2",                       "Self-hosted pipeline + Jenkinsfile"],
        ["10", "GitLab Runner on EC2",                 ".gitlab-ci.yml + Runner registration"],
        ["11", "Server Security",                      "UFW · SSH hardening · Fail2Ban"],
        ["12", "Debug & Troubleshoot",                 "Common errors + fix commands"],
        ["13", "Quick Reference Commands",             "Monitor · Logs · Maintain"],
    ]
    e.append(tbl(["#","Section","Covers"], toc_rows, widths=[10*mm, 72*mm, PW-84*mm]))
    e.append(PageBreak())
    return e

# ── 1. EC2 Launch ─────────────────────────────────────────────────────
def s1():
    e = []
    e.append(section_header("1","AWS EC2 Instance Launch","Step-by-step from AWS Console to SSH connection"))
    e.append(sp(6))
    e.append(steps([
        ("AWS Console → EC2", "Login to console.aws.amazon.com → EC2 → Launch Instance"),
        ("Name the instance",  "Example: commilk-prod"),
        ("Choose AMI",         "Ubuntu Server 24.04 LTS — 64-bit (HVM) / SSD Volume Type"),
        ("Instance Type",      "t3.small for MVP production. t2.micro = free tier but only for testing."),
        ("Key Pair",           "Click 'Create new key pair' → Name: commilk-key → RSA → .pem → Download. NEVER lose this file."),
        ("Security Group",     "Configure inbound rules — see table below"),
        ("Storage",            "Change 8 GB to 20 GB gp3 SSD (default is not enough)"),
        ("Launch",             "Click 'Launch Instance' — wait 1-2 minutes for running state"),
    ]))
    e.append(sp(8))

    e.append(h3("Security Group — Inbound Rules"))
    e.append(tbl(
        ["Port","Protocol","Source","Purpose"],
        [
            ["22",   "TCP", "My IP only — never 0.0.0.0/0", "SSH access"],
            ["80",   "TCP", "0.0.0.0/0",    "HTTP (Nginx handles, redirects to HTTPS)"],
            ["443",  "TCP", "0.0.0.0/0",    "HTTPS (production traffic)"],
            ["8000", "TCP", "My IP only",   "FastAPI direct access (dev/debug only)"],
            ["3000", "TCP", "My IP only",   "Node.js direct access (dev/debug only)"],
        ],
        widths=[14*mm, 22*mm, 62*mm, PW-100*mm]
    ))
    e.append(sp(6))

    e.append(h3("Instance Type Reference"))
    e.append(tbl(
        ["Type","vCPU","RAM","Cost/mo (approx)","Recommended for"],
        [
            ["t2.micro",  "1", "1 GB",  "Free tier",  "Learning / testing only"],
            ["t3.small",  "2", "2 GB",  "~$15 USD",   "CommilK MVP production"],
            ["t3.medium", "2", "4 GB",  "~$30 USD",   "Phase 2 scale"],
            ["t3.large",  "2", "8 GB",  "~$60 USD",   "High traffic + full Docker stack"],
        ],
        widths=[22*mm, 16*mm, 16*mm, 32*mm, PW-88*mm]
    ))
    e.append(sp(8))

    e.append(h3("Assign Elastic IP (Required)"))
    e.append(body("Without Elastic IP, your instance gets a new public IP on every restart. Assign once, keep forever."))
    e.append(steps([
        ("EC2 → Elastic IPs",   "Left sidebar → Network & Security → Elastic IPs"),
        ("Allocate",            "Click 'Allocate Elastic IP address' → Allocate"),
        ("Associate",           "Select the new IP → Actions → Associate → choose your instance"),
    ]))
    e.append(warn("Elastic IP is free while instance is running. You are charged if instance is STOPPED but IP is still allocated."))
    e.append(sp(8))

    e.append(h3("SSH — Connect to Your Instance"))
    e.append(code([
        "# ── Linux / Mac / Git Bash ──────────────────────────────────────",
        "chmod 400 ~/Downloads/commilk-key.pem",
        "ssh -i ~/Downloads/commilk-key.pem ubuntu@YOUR_ELASTIC_IP",
        "",
        "# ── Windows PowerShell ───────────────────────────────────────────",
        "ssh -i C:\\Users\\YourName\\Downloads\\commilk-key.pem ubuntu@YOUR_IP",
        "",
        "# ── Windows PuTTY ────────────────────────────────────────────────",
        "# Step 1: Open PuTTYgen → Load .pem file → Save Private Key (.ppk)",
        "# Step 2: PuTTY → Host: YOUR_IP → SSH → Auth → Browse .ppk file",
        "",
        "# ── SSH Shortcut (recommended) ───────────────────────────────────",
        "# Add to ~/.ssh/config:",
        "Host commilk",
        "    HostName YOUR_ELASTIC_IP",
        "    User ubuntu",
        "    IdentityFile ~/Downloads/commilk-key.pem",
        "",
        "# Then connect with just:",
        "ssh commilk",
    ]))
    e.append(PageBreak())
    return e

# ── 2. Ubuntu Setup ───────────────────────────────────────────────────
def s2():
    e = []
    e.append(section_header("2","Ubuntu Initial Server Setup","Run these once after first SSH login"))
    e.append(sp(6))

    e.append(h3("Step 1 — System Update + Essential Tools"))
    e.append(code([
        "sudo apt update && sudo apt upgrade -y",
        "",
        "sudo apt install -y \\",
        "    curl wget git unzip build-essential \\",
        "    software-properties-common apt-transport-https \\",
        "    ca-certificates gnupg lsb-release \\",
        "    ufw fail2ban htop tree nano vim net-tools",
        "",
        "# Verify Ubuntu version",
        "lsb_release -a",
    ]))
    e.append(sp(8))

    e.append(h3("Step 2 — Create Non-Root Deploy User (Security Best Practice)"))
    e.append(code([
        "# Create deploy user",
        "sudo adduser deploy",
        "",
        "# Give sudo access",
        "sudo usermod -aG sudo deploy",
        "",
        "# Copy SSH key so deploy user can also login",
        "sudo mkdir -p /home/deploy/.ssh",
        "sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/",
        "sudo chown -R deploy:deploy /home/deploy/.ssh",
        "sudo chmod 700 /home/deploy/.ssh",
        "sudo chmod 600 /home/deploy/.ssh/authorized_keys",
        "",
        "# Test in a NEW terminal (don't close current one yet)",
        "ssh -i commilk-key.pem deploy@YOUR_ELASTIC_IP",
    ]))
    e.append(sp(8))

    e.append(h3("Step 3 — Add Swap Memory"))
    e.append(body("Essential for t3.small (2GB RAM). Prevents out-of-memory crashes during Docker builds."))
    e.append(code([
        "# Create 2GB swap file",
        "sudo fallocate -l 2G /swapfile",
        "sudo chmod 600 /swapfile",
        "sudo mkswap /swapfile",
        "sudo swapon /swapfile",
        "",
        "# Make permanent (survives reboot)",
        "echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab",
        "",
        "# Verify",
        "free -h",
        "swapon --show",
    ]))
    e.append(PageBreak())
    return e

# ── 3. Docker ─────────────────────────────────────────────────────────
def s3():
    e = []
    e.append(section_header("3","Docker Install on Ubuntu","Official Docker CE + Compose plugin"))
    e.append(sp(6))
    e.append(code([
        "# Add Docker's official GPG key",
        "curl -fsSL https://download.docker.com/linux/ubuntu/gpg \\",
        "    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
        "",
        "# Add Docker repository",
        'echo "deb [arch=$(dpkg --print-architecture) \\',
        "    signed-by=/etc/apt/keyrings/docker.gpg] \\",
        "    https://download.docker.com/linux/ubuntu \\",
        '    $(lsb_release -cs) stable" \\',
        "    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null",
        "",
        "# Install Docker CE + Compose plugin",
        "sudo apt update",
        "sudo apt install -y docker-ce docker-ce-cli containerd.io \\",
        "    docker-buildx-plugin docker-compose-plugin",
        "",
        "# Run Docker without sudo",
        "sudo usermod -aG docker $USER",
        "newgrp docker",
        "",
        "# Enable auto-start on boot",
        "sudo systemctl enable docker",
        "sudo systemctl start docker",
        "",
        "# Verify installation",
        "docker --version",
        "docker compose version",
        "docker run hello-world",
    ]))
    e.append(sp(6))
    e.append(tip("Log out and log back in after adding yourself to the docker group for it to take effect."))
    e.append(PageBreak())
    return e

# ── 4. FastAPI ────────────────────────────────────────────────────────
def s4():
    e = []
    e.append(section_header("4","FastAPI — Complete Deployment","Dockerfile · Compose · Systemd service · .env setup"))
    e.append(sp(6))

    e.append(h3("4.1 Project Structure"))
    e.append(code([
        "commilk/",
        "├── backend/",
        "│   ├── app/",
        "│   │   ├── main.py",
        "│   │   ├── routes/",
        "│   │   └── models/",
        "│   ├── requirements.txt",
        "│   └── Dockerfile         ← create this",
        "├── nginx/",
        "│   └── nginx.conf         ← create this",
        "├── docker-compose.yml     ← create this",
        "└── .env                   ← create this (never commit!)",
    ]))
    e.append(sp(8))

    e.append(h3("4.2 backend/Dockerfile — Multi-stage Production Build"))
    e.append(code([
        "# ════════════════════════════════════════════",
        "# Stage 1: Builder — install all dependencies",
        "# ════════════════════════════════════════════",
        "FROM python:3.11-slim AS builder",
        "WORKDIR /app",
        "",
        "RUN apt-get update && apt-get install -y \\",
        "    build-essential libpq-dev \\",
        "    && rm -rf /var/lib/apt/lists/*",
        "",
        "COPY requirements.txt .",
        "RUN pip install --user --no-cache-dir -r requirements.txt",
        "",
        "# ════════════════════════════════════════════",
        "# Stage 2: Production — lean final image",
        "# ════════════════════════════════════════════",
        "FROM python:3.11-slim",
        "WORKDIR /app",
        "",
        "RUN apt-get update && apt-get install -y libpq5 curl \\",
        "    && rm -rf /var/lib/apt/lists/*",
        "",
        "# Non-root user for security",
        "RUN groupadd -r appuser && useradd -r -g appuser appuser",
        "",
        "# Copy installed packages from builder",
        "COPY --from=builder /root/.local /home/appuser/.local",
        "",
        "# Copy application code",
        "COPY ./app ./app",
        "",
        "ENV PATH=/home/appuser/.local/bin:$PATH",
        "ENV PYTHONUNBUFFERED=1",
        "ENV PYTHONDONTWRITEBYTECODE=1",
        "",
        "USER appuser",
        "EXPOSE 8000",
        "",
        "HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\",
        "    CMD curl -f http://localhost:8000/health || exit 1",
        "",
        'CMD ["uvicorn", "app.main:app",',
        '     "--host", "0.0.0.0",',
        '     "--port", "8000",',
        '     "--workers", "4",',
        '     "--log-level", "info"]',
    ]))
    e.append(sp(8))

    e.append(h3("4.3 backend/.dockerignore"))
    e.append(code([
        "__pycache__/",
        "*.pyc",
        "*.pyo",
        ".venv/",
        "venv/",
        "env/",
        ".env",
        ".env.*",
        "!.env.example",
        ".git/",
        ".gitignore",
        "tests/",
        "*.log",
        "*.md",
        "Dockerfile*",
        "docker-compose*",
        ".DS_Store",
    ]))
    e.append(sp(8))

    e.append(h3("4.4 .env File — Secrets Configuration"))
    e.append(code([
        "# Copy and fill in values — NEVER commit this file to git",
        "",
        "# Supabase",
        "SUPABASE_URL=https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here",
        "SUPABASE_ANON_KEY=your_anon_key_here",
        "",
        "# LLM — Primary",
        "GROQ_API_KEY=your_groq_api_key",
        "",
        "# LLM — Fallbacks",
        "TOGETHER_API_KEY=your_together_ai_key",
        "",
        "# Application",
        "SECRET_KEY=minimum-32-characters-random-secret-string",
        "ENVIRONMENT=production",
        "ALLOWED_ORIGINS=https://yourdomain.com",
        "API_VERSION=v1",
    ]))
    e.append(sp(8))

    e.append(h3("4.5 Deploy Without Docker (Direct Python + Systemd)"))
    e.append(code([
        "# Install Python 3.11",
        "sudo add-apt-repository ppa:deadsnakes/ppa -y",
        "sudo apt update",
        "sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip",
        "",
        "# Clone and set up",
        "mkdir -p /home/deploy/commilk",
        "cd /home/deploy/commilk",
        "git clone https://github.com/youruser/commilk.git .",
        "",
        "# Create virtual environment",
        "python3.11 -m venv .venv",
        "source .venv/bin/activate",
        "pip install --upgrade pip",
        "pip install -r backend/requirements.txt",
        "",
        "# Create .env file",
        "cp .env.example .env",
        "nano .env",
        "",
        "# Quick test",
        "cd backend",
        "uvicorn app.main:app --host 0.0.0.0 --port 8000",
        "# Press Ctrl+C — use systemd for production",
    ]))
    e.append(sp(8))

    e.append(h3("4.6 Systemd Service — Auto-start on Boot"))
    e.append(code([
        "sudo nano /etc/systemd/system/commilk-api.service",
    ]))
    e.append(sp(4))
    e.append(code([
        "[Unit]",
        "Description=CommilK FastAPI Application",
        "After=network.target",
        "Wants=network-online.target",
        "",
        "[Service]",
        "Type=exec",
        "User=deploy",
        "Group=deploy",
        "WorkingDirectory=/home/deploy/commilk/backend",
        "Environment=PATH=/home/deploy/commilk/.venv/bin",
        "EnvironmentFile=/home/deploy/commilk/.env",
        "ExecStart=/home/deploy/commilk/.venv/bin/uvicorn \\",
        "    app.main:app \\",
        "    --host 0.0.0.0 \\",
        "    --port 8000 \\",
        "    --workers 4 \\",
        "    --log-level info",
        "Restart=always",
        "RestartSec=5",
        "StandardOutput=journal",
        "StandardError=journal",
        "SyslogIdentifier=commilk-api",
        "",
        "[Install]",
        "WantedBy=multi-user.target",
    ]))
    e.append(sp(4))
    e.append(code([
        "# Enable and start",
        "sudo systemctl daemon-reload",
        "sudo systemctl enable commilk-api",
        "sudo systemctl start commilk-api",
        "",
        "# Check status",
        "sudo systemctl status commilk-api",
        "",
        "# Follow live logs",
        "sudo journalctl -u commilk-api -f",
    ]))
    e.append(tip("Systemd automatically restarts the API if it crashes. It also starts on server reboot."))
    e.append(PageBreak())
    return e

# ── 5. Node/Express ───────────────────────────────────────────────────
def s5():
    e = []
    e.append(section_header("5","Node.js / Express — Complete Deployment","nvm · PM2 cluster · Dockerfile · Deploy script"))
    e.append(sp(6))

    e.append(h3("5.1 Install Node.js via nvm"))
    e.append(code([
        "# Install nvm (Node Version Manager)",
        "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
        "",
        "# Reload shell",
        "source ~/.bashrc",
        "",
        "# Install Node.js 20 LTS",
        "nvm install 20",
        "nvm use 20",
        "nvm alias default 20",
        "",
        "# Verify",
        "node --version    # should show v20.x.x",
        "npm --version",
        "",
        "# Clone and install dependencies",
        "mkdir -p /home/deploy/commilk-node",
        "cd /home/deploy/commilk-node",
        "git clone https://github.com/youruser/commilk-node.git .",
        "npm ci --only=production",
        "",
        "# Quick test",
        "node src/server.js",
        "# Press Ctrl+C — use PM2 for production",
    ]))
    e.append(sp(8))

    e.append(h3("5.2 PM2 — Production Process Manager"))
    e.append(code([
        "# Install PM2 globally",
        "npm install -g pm2",
        "",
        "# Create ecosystem config file",
        "nano /home/deploy/commilk-node/ecosystem.config.js",
    ]))
    e.append(sp(4))
    e.append(code([
        "module.exports = {",
        "  apps: [{",
        "    name:               'commilk-api',",
        "    script:             'src/server.js',",
        "    instances:          'max',           // use all CPU cores",
        "    exec_mode:          'cluster',        // load balance across cores",
        "    env: {",
        "      NODE_ENV:         'production',",
        "      PORT:             3000",
        "    },",
        "    env_file:           '.env',",
        "    watch:              false,",
        "    max_memory_restart: '512M',           // restart if memory exceeds 512MB",
        "    autorestart:        true,",
        "    max_restarts:       10,",
        "    restart_delay:      5000,             // wait 5s before restart",
        "    log_date_format:    'YYYY-MM-DD HH:mm:ss',",
        "    out_file:           '/var/log/commilk/node-out.log',",
        "    error_file:         '/var/log/commilk/node-error.log',",
        "    merge_logs:         true",
        "  }]",
        "};",
    ]))
    e.append(sp(4))
    e.append(code([
        "# Create log directory",
        "sudo mkdir -p /var/log/commilk",
        "sudo chown deploy:deploy /var/log/commilk",
        "",
        "# Start the application",
        "cd /home/deploy/commilk-node",
        "pm2 start ecosystem.config.js",
        "",
        "# Set up auto-start on server reboot",
        "pm2 startup systemd",
        "# IMPORTANT: Copy and run the command that PM2 outputs (starts with sudo)",
        "",
        "# Save the process list",
        "pm2 save",
    ]))
    e.append(sp(8))

    e.append(h3("5.3 PM2 Essential Commands"))
    e.append(tbl(
        ["Command", "Purpose"],
        [
            ["pm2 status",                     "View all running processes"],
            ["pm2 logs commilk-api",            "Follow live logs"],
            ["pm2 logs commilk-api --lines 50", "Show last 50 log lines"],
            ["pm2 restart commilk-api",         "Restart (brief downtime)"],
            ["pm2 reload commilk-api",          "Zero-downtime reload (rolling restart)"],
            ["pm2 stop commilk-api",            "Stop process"],
            ["pm2 delete commilk-api",          "Remove from PM2"],
            ["pm2 monit",                       "Live dashboard — CPU, RAM, logs"],
            ["pm2 describe commilk-api",        "Full process details"],
        ],
        widths=[72*mm, PW-74*mm]
    ))
    e.append(sp(8))

    e.append(h3("5.4 Node/Express Dockerfile"))
    e.append(code([
        "# ════════════════════════════════════════════",
        "# Stage 1: Install dependencies",
        "# ════════════════════════════════════════════",
        "FROM node:20-alpine AS deps",
        "WORKDIR /app",
        "COPY package*.json ./",
        "# npm ci uses exact versions from package-lock.json",
        "RUN npm ci --only=production",
        "",
        "# ════════════════════════════════════════════",
        "# Stage 2: Production image",
        "# ════════════════════════════════════════════",
        "FROM node:20-alpine",
        "WORKDIR /app",
        "",
        "# Non-root user",
        "RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001",
        "",
        "COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules",
        "COPY --chown=nodeapp:nodejs . .",
        "",
        "USER nodeapp",
        "ENV NODE_ENV=production",
        "EXPOSE 3000",
        "",
        "HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\",
        "    CMD node -e \"require('http').get('http://localhost:3000/health', \\",
        "    r => process.exit(r.statusCode === 200 ? 0 : 1))\"",
        "",
        'CMD ["node", "src/server.js"]',
    ]))
    e.append(sp(8))

    e.append(h3("5.5 Deploy Script — git pull + reload"))
    e.append(code([
        "# Create deploy script",
        "nano /home/deploy/deploy.sh",
    ]))
    e.append(sp(4))
    e.append(code([
        "#!/bin/bash",
        "set -e   # exit on any error",
        "",
        "APP_DIR=/home/deploy/commilk-node",
        "",
        "echo '==============================='",
        "echo ' CommilK Node — Deploying...'",
        "echo '==============================='",
        "",
        "cd $APP_DIR",
        "",
        "echo '--- Pulling latest code ---'",
        "git pull origin main",
        "",
        "echo '--- Installing dependencies ---'",
        "npm ci --only=production",
        "",
        "echo '--- Reloading application (zero downtime) ---'",
        "pm2 reload ecosystem.config.js --update-env",
        "",
        "echo '--- Status ---'",
        "pm2 status",
        "",
        "echo '==============================='",
        "echo ' Deploy complete!'",
        "echo '==============================='",
    ]))
    e.append(sp(4))
    e.append(code([
        "chmod +x /home/deploy/deploy.sh",
        "",
        "# Run deployment",
        "./deploy.sh",
    ]))
    e.append(PageBreak())
    return e

# ── 6. Nginx + SSL ────────────────────────────────────────────────────
def s6():
    e = []
    e.append(section_header("6","Nginx + SSL Configuration","Reverse proxy · Security headers · Let's Encrypt free SSL"))
    e.append(sp(6))

    e.append(h3("6.1 Install Nginx"))
    e.append(code([
        "sudo apt install -y nginx",
        "sudo systemctl enable nginx",
        "sudo systemctl start nginx",
        "",
        "# Test in browser — you should see nginx welcome page",
        "# http://YOUR_ELASTIC_IP",
        "",
        "# Create site config",
        "sudo nano /etc/nginx/sites-available/commilk",
    ]))
    e.append(sp(8))

    e.append(h3("6.2 nginx.conf — FastAPI (port 8000)"))
    e.append(code([
        "# /etc/nginx/sites-available/commilk",
        "",
        "# Rate limiting zones (define once in http block)",
        "limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;",
        "limit_req_zone $binary_remote_addr zone=auth:10m    rate=5r/m;",
        "limit_req_zone $binary_remote_addr zone=ai:10m      rate=20r/m;",
        "",
        "# ── Redirect HTTP to HTTPS ────────────────────────────────────",
        "server {",
        "    listen 80;",
        "    server_name api.yourdomain.com;",
        "",
        "    # Required for certbot certificate renewal",
        "    location /.well-known/acme-challenge/ {",
        "        root /var/www/certbot;",
        "    }",
        "",
        "    location / {",
        "        return 301 https://$host$request_uri;",
        "    }",
        "}",
        "",
        "# ── HTTPS Main Server ─────────────────────────────────────────",
        "server {",
        "    listen 443 ssl;",
        "    server_name api.yourdomain.com;",
        "",
        "    # SSL — certbot will fill these paths automatically",
        "    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;",
        "    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;",
        "    ssl_protocols       TLSv1.2 TLSv1.3;",
        "    ssl_ciphers         HIGH:!aNULL:!MD5;",
        "    ssl_session_cache   shared:SSL:10m;",
        "",
        "    # Security headers",
        "    add_header X-Frame-Options           'SAMEORIGIN'                      always;",
        "    add_header X-Content-Type-Options    'nosniff'                         always;",
        "    add_header X-XSS-Protection          '1; mode=block'                   always;",
        "    add_header Strict-Transport-Security 'max-age=31536000'                always;",
        "    add_header Referrer-Policy           'strict-origin-when-cross-origin' always;",
        "",
        "    # Max upload size",
        "    client_max_body_size 10M;",
        "",
        "    # ── General API ─────────────────────────────────────────",
        "    location / {",
        "        limit_req zone=general burst=20 nodelay;",
        "        proxy_pass         http://127.0.0.1:8000;",
        "        proxy_http_version 1.1;",
        "        proxy_set_header   Host              $host;",
        "        proxy_set_header   X-Real-IP         $remote_addr;",
        "        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;",
        "        proxy_set_header   X-Forwarded-Proto $scheme;",
        "        proxy_read_timeout 60s;",
        "    }",
        "",
        "    # ── Auth endpoints — strict rate limit ──────────────────",
        "    location ~ ^/api/v1/auth/ {",
        "        limit_req zone=auth burst=3 nodelay;",
        "        proxy_pass       http://127.0.0.1:8000;",
        "        proxy_set_header X-Real-IP       $remote_addr;",
        "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
        "    }",
        "",
        "    # ── AI chat — extended timeout for LLM responses ─────────",
        "    location /api/v1/ai/ {",
        "        limit_req zone=ai burst=5 nodelay;",
        "        proxy_pass         http://127.0.0.1:8000;",
        "        proxy_read_timeout 120s;",
        "    }",
        "",
        "    # ── Health check — no logging ────────────────────────────",
        "    location /health {",
        "        access_log off;",
        "        proxy_pass http://127.0.0.1:8000/health;",
        "    }",
        "}",
    ]))
    e.append(sp(6))
    e.append(body("For Node.js/Express — replace proxy_pass with: http://127.0.0.1:3000"))
    e.append(body("For Docker Compose — replace proxy_pass with: http://api:8000 (container name)"))
    e.append(sp(8))

    e.append(h3("6.3 Enable Site + Get SSL Certificate"))
    e.append(code([
        "# Enable site",
        "sudo ln -s /etc/nginx/sites-available/commilk /etc/nginx/sites-enabled/",
        "",
        "# Remove default site (if exists)",
        "sudo rm -f /etc/nginx/sites-enabled/default",
        "",
        "# Test config syntax",
        "sudo nginx -t",
        "",
        "# Reload nginx",
        "sudo systemctl reload nginx",
        "",
        "# ── SSL Certificate (Let's Encrypt — Free) ────────────────",
        "# IMPORTANT: Your domain's A record must point to EC2 IP first!",
        "",
        "sudo apt install -y certbot python3-certbot-nginx",
        "",
        "sudo certbot --nginx \\",
        "    -d api.yourdomain.com \\",
        "    --email your@email.com \\",
        "    --agree-tos \\",
        "    --non-interactive",
        "",
        "# Test auto-renewal",
        "sudo certbot renew --dry-run",
        "",
        "# Check renewal timer is active",
        "sudo systemctl status certbot.timer",
    ]))
    e.append(danger("Point your domain A record to EC2 Elastic IP BEFORE running certbot. Without DNS, certificate issuance will fail."))
    e.append(PageBreak())
    return e

# ── 7. Docker Compose ─────────────────────────────────────────────────
def s7():
    e = []
    e.append(section_header("7","Docker Compose Files","Production configs for FastAPI and Node/Express"))
    e.append(sp(6))

    e.append(h3("7.1 docker-compose.yml — FastAPI + Nginx (Production)"))
    e.append(code([
        "version: '3.9'",
        "",
        "services:",
        "",
        "  # ── FastAPI Backend ────────────────────────────────────────",
        "  api:",
        "    build:",
        "      context: ./backend",
        "      dockerfile: Dockerfile",
        "    container_name: commilk_api",
        "    restart: unless-stopped",
        "    expose:",
        "      - '8000'              # only visible inside docker network",
        "    env_file:",
        "      - .env",
        "    networks:",
        "      - app-network",
        "    healthcheck:",
        "      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']",
        "      interval: 30s",
        "      timeout: 10s",
        "      retries: 3",
        "      start_period: 40s",
        "    logging:",
        "      driver: json-file",
        "      options:",
        "        max-size: '10m'",
        "        max-file: '3'",
        "",
        "  # ── Nginx Reverse Proxy ────────────────────────────────────",
        "  nginx:",
        "    image: nginx:1.25-alpine",
        "    container_name: commilk_nginx",
        "    restart: unless-stopped",
        "    ports:",
        "      - '80:80'",
        "      - '443:443'",
        "    volumes:",
        "      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro",
        "      - /etc/letsencrypt:/etc/letsencrypt:ro",
        "      - /var/www/certbot:/var/www/certbot:ro",
        "    depends_on:",
        "      api:",
        "        condition: service_healthy",
        "    networks:",
        "      - app-network",
        "",
        "networks:",
        "  app-network:",
        "    driver: bridge",
    ]))
    e.append(sp(8))

    e.append(h3("7.2 docker-compose.yml — Node/Express + Nginx (Production)"))
    e.append(code([
        "version: '3.9'",
        "",
        "services:",
        "",
        "  api:",
        "    build:",
        "      context: .",
        "      dockerfile: Dockerfile",
        "    container_name: commilk_node",
        "    restart: unless-stopped",
        "    expose:",
        "      - '3000'",
        "    environment:",
        "      - NODE_ENV=production",
        "    env_file:",
        "      - .env",
        "    networks:",
        "      - app-network",
        "    healthcheck:",
        "      test: ['CMD', 'node', '-e',",
        "        \"require('http').get('http://localhost:3000/health',\",",
        "        \"r=>process.exit(r.statusCode===200?0:1))\"]",
        "      interval: 30s",
        "      timeout: 10s",
        "      retries: 3",
        "      start_period: 30s",
        "",
        "  nginx:",
        "    image: nginx:1.25-alpine",
        "    container_name: commilk_nginx",
        "    restart: unless-stopped",
        "    ports:",
        "      - '80:80'",
        "      - '443:443'",
        "    volumes:",
        "      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro",
        "      - /etc/letsencrypt:/etc/letsencrypt:ro",
        "    depends_on:",
        "      api:",
        "        condition: service_healthy",
        "    networks:",
        "      - app-network",
        "",
        "networks:",
        "  app-network:",
        "    driver: bridge",
    ]))
    e.append(sp(8))

    e.append(h3("7.3 docker-compose.override.yml — Local Development"))
    e.append(body("This file is auto-loaded during development. It overrides the production config without modifying it."))
    e.append(code([
        "# docker-compose.override.yml",
        "# Auto-loaded with: docker compose up",
        "# Ignored with:     docker compose -f docker-compose.yml up",
        "",
        "version: '3.9'",
        "",
        "services:",
        "  api:",
        "    environment:",
        "      - ENVIRONMENT=development",
        "    volumes:",
        "      - ./backend:/app          # mount code for hot reload",
        "    ports:",
        "      - '8000:8000'             # expose port directly in dev",
        "    command: >",
        "      uvicorn app.main:app",
        "      --host 0.0.0.0",
        "      --port 8000",
        "      --reload",
        "",
        "  nginx:",
        "    ports:",
        "      - '80:80'                 # no HTTPS in local dev",
        "",
        "# For Node.js dev override:",
        "# command: node --watch src/server.js",
        "# ports: ['3000:3000']",
    ]))
    e.append(sp(8))

    e.append(h3("7.4 Docker Compose Commands — EC2 Deployment"))
    e.append(code([
        "# ── First-time setup ──────────────────────────────────────────",
        "git clone https://github.com/youruser/commilk.git",
        "cd commilk",
        "cp .env.example .env",
        "nano .env                          # fill in your secrets",
        "",
        "# Get SSL certificate before starting nginx",
        "sudo certbot certonly --standalone -d api.yourdomain.com",
        "",
        "# Build and start all services",
        "docker compose up -d --build",
        "",
        "# ── Day-to-day operations ─────────────────────────────────────",
        "docker compose ps                  # status of all containers",
        "docker compose logs -f             # follow all logs",
        "docker compose logs -f api         # follow only api logs",
        "",
        "# ── Deploy code update ────────────────────────────────────────",
        "git pull origin main",
        "docker compose up -d --build --no-deps api   # rebuild only api",
        "docker system prune -f                        # cleanup old images",
        "",
        "# ── Stop / restart ───────────────────────────────────────────",
        "docker compose restart api         # restart one service",
        "docker compose down                # stop all (data preserved)",
        "docker compose down -v             # stop + delete volumes (data lost!)",
    ]))
    e.append(PageBreak())
    return e

# ── 8. GitHub Actions ─────────────────────────────────────────────────
def s8():
    e = []
    e.append(section_header("8","GitHub Actions CI/CD","Auto-deploy on git push — no manual steps"))
    e.append(sp(6))

    e.append(h3("8.1 How it Works"))
    e.append(tbl(
        ["Step","What Happens"],
        [
            ["git push main",       "GitHub receives your code push"],
            ["Trigger",             "GitHub Actions workflow starts automatically"],
            ["Test job",            "Runs pytest (FastAPI) or npm test (Node)"],
            ["If tests pass",       "Deploy job starts"],
            ["SSH into EC2",        "GitHub Actions connects via SSH key"],
            ["Run deploy script",   "git pull → docker compose up --build"],
            ["Health check",        "Curl /health endpoint — fail if broken"],
            ["Done",                "App is live — total time ~3 minutes"],
        ],
        widths=[42*mm, PW-44*mm]
    ))
    e.append(sp(8))

    e.append(h3("8.2 Create SSH Deploy Key on EC2"))
    e.append(code([
        "# Run this on EC2 as deploy user",
        "ssh-keygen -t ed25519 -C 'github-actions-deploy' -f ~/.ssh/github_deploy -N ''",
        "",
        "# Add public key to authorized_keys",
        "cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys",
        "",
        "# Print the private key — copy this to GitHub Secrets",
        "cat ~/.ssh/github_deploy",
        "# Copy everything from -----BEGIN through END-----",
    ]))
    e.append(sp(8))

    e.append(h3("8.3 GitHub Secrets to Add"))
    e.append(steps([
        ("Go to GitHub",         "Your repo → Settings → Secrets and variables → Actions"),
        ("New secret: EC2_HOST", "Value: your Elastic IP or domain (e.g. api.yourdomain.com)"),
        ("New secret: SSH_PRIVATE_KEY", "Paste the full private key content from step above"),
        ("Optional: SLACK_WEBHOOK_URL", "Slack webhook for deploy notifications"),
    ]))
    e.append(sp(8))

    e.append(h3("8.4 .github/workflows/deploy.yml"))
    e.append(code([
        "# Create file at: .github/workflows/deploy.yml",
        "",
        "name: Deploy to EC2",
        "",
        "on:",
        "  push:",
        "    branches: [main]",
        "  pull_request:",
        "    branches: [main]",
        "",
        "jobs:",
        "",
        "  # ── Job 1: Run Tests ──────────────────────────────────────",
        "  test:",
        "    name: Run Tests",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "",
        "      # ---- FastAPI Tests ----",
        "      - name: Set up Python",
        "        uses: actions/setup-python@v5",
        "        with:",
        "          python-version: '3.11'",
        "          cache: pip",
        "",
        "      - name: Install dependencies",
        "        run: pip install -r backend/requirements.txt pytest pytest-asyncio httpx",
        "",
        "      - name: Run pytest",
        "        run: cd backend && pytest tests/ -v --tb=short",
        "",
        "      # ---- Node Tests (uncomment if using Node) ----",
        "      # - uses: actions/setup-node@v4",
        "      #   with: { node-version: '20', cache: npm }",
        "      # - run: npm ci",
        "      # - run: npm test",
        "",
        "  # ── Job 2: Deploy to EC2 ──────────────────────────────────",
        "  deploy:",
        "    name: Deploy to Production",
        "    needs: test",
        "    runs-on: ubuntu-latest",
        "    if: github.ref == 'refs/heads/main'",
        "    steps:",
        "",
        "      - name: Deploy via SSH",
        "        uses: appleboy/ssh-action@v1.0.0",
        "        with:",
        "          host:     ${{ secrets.EC2_HOST }}",
        "          username: deploy",
        "          key:      ${{ secrets.SSH_PRIVATE_KEY }}",
        "          port:     22",
        "          timeout:  120s",
        "          script: |",
        "            set -e",
        "            cd /home/deploy/commilk",
        "            echo '--- Pulling latest code ---'",
        "            git pull origin main",
        "            echo '--- Rebuilding API container ---'",
        "            docker compose up -d --build --no-deps api",
        "            echo '--- Cleaning up old images ---'",
        "            docker system prune -f",
        "            echo '--- Health check ---'",
        "            sleep 5",
        "            curl -f http://localhost:8000/health || exit 1",
        "            echo '--- Deploy successful! ---'",
        "",
        "      - name: Notify Slack",
        "        if: success()",
        "        run: |",
        "          curl -X POST -H 'Content-type: application/json' \\",
        "            --data '{\"text\":\"CommilK deployed to production!\"}' \\",
        "            ${{ secrets.SLACK_WEBHOOK_URL }}",
    ]))
    e.append(PageBreak())
    return e

# ── 9. Jenkins ────────────────────────────────────────────────────────
def s9():
    e = []
    e.append(section_header("9","Jenkins on EC2","Self-hosted CI/CD server — full control"))
    e.append(sp(6))

    e.append(h3("9.1 Install Jenkins"))
    e.append(code([
        "# Add Jenkins repository",
        "sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \\",
        "    https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key",
        "",
        'echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \\',
        '    https://pkg.jenkins.io/debian-stable binary/" \\',
        "    | sudo tee /etc/apt/sources.list.d/jenkins.list",
        "",
        "sudo apt update",
        "sudo apt install -y openjdk-17-jre jenkins",
        "",
        "sudo systemctl enable jenkins",
        "sudo systemctl start jenkins",
        "",
        "# Allow Jenkins port (temporarily for setup)",
        "sudo ufw allow 8080/tcp",
        "",
        "# Get initial admin password",
        "sudo cat /var/lib/jenkins/secrets/initialAdminPassword",
        "",
        "# Open browser: http://YOUR_EC2_IP:8080",
    ]))
    e.append(sp(8))

    e.append(h3("9.2 Jenkinsfile — Place in repo root"))
    e.append(code([
        "pipeline {",
        "    agent any",
        "",
        "    environment {",
        "        EC2_HOST = credentials('ec2-host')",
        "        SSH_KEY  = credentials('ec2-ssh-key')",
        "    }",
        "",
        "    options {",
        "        timeout(time: 20, unit: 'MINUTES')",
        "        disableConcurrentBuilds()",
        "        buildDiscarder(logRotator(numToKeepStr: '10'))",
        "    }",
        "",
        "    triggers { githubPush() }",
        "",
        "    stages {",
        "",
        "        stage('Checkout') {",
        "            steps { checkout scm }",
        "        }",
        "",
        "        stage('Lint + Test') {",
        "            steps {",
        "                sh '''",
        "                    pip install -r backend/requirements.txt pytest flake8",
        "                    flake8 backend/app/ --max-line-length=100",
        "                    cd backend && pytest tests/ -v",
        "                '''",
        "            }",
        "            post {",
        "                always {",
        "                    junit 'backend/test-results.xml'",
        "                }",
        "            }",
        "        }",
        "",
        "        stage('Build Docker Image') {",
        "            when { branch 'main' }",
        "            steps {",
        "                sh 'docker compose build api'",
        "            }",
        "        }",
        "",
        "        stage('Deploy to EC2') {",
        "            when { branch 'main' }",
        "            steps {",
        "                sh '''",
        "                    ssh -i $SSH_KEY -o StrictHostKeyChecking=no \\",
        "                        deploy@$EC2_HOST \\",
        "                        'cd /home/deploy/commilk && \\",
        "                         git pull origin main && \\",
        "                         docker compose up -d --build --no-deps api && \\",
        "                         docker system prune -f && \\",
        "                         curl -f http://localhost:8000/health'",
        "                '''",
        "            }",
        "        }",
        "    }",
        "",
        "    post {",
        "        success { echo 'Pipeline passed — deployed!' }",
        "        failure  { mail to: 'team@example.com', subject: 'Build Failed: $JOB_NAME' }",
        "        always   { cleanWs() }",
        "    }",
        "}",
    ]))
    e.append(tip("Block Jenkins port 8080 from public after setup. Use Nginx reverse proxy to expose Jenkins on HTTPS."))
    e.append(PageBreak())
    return e

# ── 10. GitLab Runner ─────────────────────────────────────────────────
def s10():
    e = []
    e.append(section_header("10","GitLab Runner on EC2","Register EC2 as a GitLab CI/CD runner"))
    e.append(sp(6))

    e.append(h3("10.1 Install + Register Runner"))
    e.append(code([
        "# Install GitLab Runner",
        "curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh \\",
        "    | sudo bash",
        "sudo apt install -y gitlab-runner",
        "",
        "# Register the runner",
        "# First get token from: GitLab project → Settings → CI/CD → Runners",
        "sudo gitlab-runner register",
        "",
        "# Enter when prompted:",
        "#   GitLab URL: https://gitlab.com",
        "#   Registration token: (paste from GitLab)",
        "#   Description: ec2-production-runner",
        "#   Tags: ec2,production,docker",
        "#   Executor: shell",
        "",
        "sudo systemctl enable gitlab-runner",
        "sudo systemctl start gitlab-runner",
        "",
        "# Give runner access to Docker",
        "sudo usermod -aG docker gitlab-runner",
    ]))
    e.append(sp(8))

    e.append(h3("10.2 .gitlab-ci.yml"))
    e.append(code([
        "image: python:3.11-slim",
        "",
        "variables:",
        "  PIP_CACHE_DIR: '$CI_PROJECT_DIR/.cache/pip'",
        "",
        "cache:",
        "  paths:",
        "    - .cache/pip/",
        "",
        "stages:",
        "  - test",
        "  - build",
        "  - deploy",
        "",
        "# ── Test Stage ────────────────────────────────────────────────",
        "test:unit:",
        "  stage: test",
        "  script:",
        "    - pip install -r backend/requirements.txt pytest pytest-cov",
        "    - cd backend",
        "    - pytest tests/ -v --cov=app --cov-report=xml",
        "  artifacts:",
        "    reports:",
        "      junit: backend/report.xml",
        "      coverage_report:",
        "        coverage_format: cobertura",
        "        path: backend/coverage.xml",
        "  only:",
        "    - merge_requests",
        "    - main",
        "",
        "# ── Build Stage ───────────────────────────────────────────────",
        "build:docker:",
        "  stage: build",
        "  image: docker:24",
        "  services:",
        "    - docker:24-dind",
        "  before_script:",
        "    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY",
        "  script:",
        "    - docker build",
        "        -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA",
        "        -t $CI_REGISTRY_IMAGE:latest",
        "        ./backend",
        "    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA",
        "    - docker push $CI_REGISTRY_IMAGE:latest",
        "  only:",
        "    - main",
        "",
        "# ── Deploy Stage (manual approval for production) ─────────────",
        "deploy:production:",
        "  stage: deploy",
        "  environment:",
        "    name: production",
        "    url: https://api.yourdomain.com",
        "  script:",
        "    - apk add --no-cache openssh",
        "    - eval $(ssh-agent -s)",
        "    - echo '$SSH_PRIVATE_KEY' | ssh-add -",
        "    - ssh -o StrictHostKeyChecking=no deploy@$EC2_HOST",
        "        'cd /home/deploy/commilk &&",
        "         docker compose pull &&",
        "         docker compose up -d --no-deps api &&",
        "         docker system prune -f'",
        "  only:",
        "    - main",
        "  when: manual       # requires manual click in GitLab UI",
    ]))
    e.append(PageBreak())
    return e

# ── 11. Security ──────────────────────────────────────────────────────
def s11():
    e = []
    e.append(section_header("11","Server Security","UFW firewall · SSH hardening · Fail2Ban"))
    e.append(sp(6))

    e.append(h3("11.1 UFW Firewall Setup"))
    e.append(code([
        "# Set default policies",
        "sudo ufw default deny incoming",
        "sudo ufw default allow outgoing",
        "",
        "# Allow required ports",
        "sudo ufw allow 22/tcp     # SSH",
        "sudo ufw allow 80/tcp     # HTTP",
        "sudo ufw allow 443/tcp    # HTTPS",
        "",
        "# Rate-limit SSH (blocks brute force attempts)",
        "sudo ufw limit 22/tcp",
        "",
        "# Enable firewall",
        "sudo ufw enable",
        "",
        "# Verify rules",
        "sudo ufw status verbose",
    ]))
    e.append(danger("ALWAYS allow port 22 BEFORE enabling UFW. If you enable without allowing SSH, you will be permanently locked out."))
    e.append(sp(8))

    e.append(h3("11.2 SSH Hardening"))
    e.append(code([
        "sudo nano /etc/ssh/sshd_config",
        "",
        "# Change these values:",
        "PermitRootLogin no          # never allow root login",
        "PasswordAuthentication no   # disable password login — keys only",
        "PubkeyAuthentication yes",
        "MaxAuthTries 3",
        "ClientAliveInterval 300",
        "ClientAliveCountMax 2",
        "X11Forwarding no",
        "AllowUsers deploy           # only this user can SSH",
        "",
        "# Restart SSH service",
        "sudo systemctl restart sshd",
        "",
        "# IMPORTANT: Test in a NEW terminal first!",
        "# Don't close your current session until you confirm login works",
    ]))
    e.append(sp(8))

    e.append(h3("11.3 Fail2Ban — Block Brute Force Attacks"))
    e.append(code([
        "sudo apt install -y fail2ban",
        "",
        "sudo nano /etc/fail2ban/jail.local",
    ]))
    e.append(sp(4))
    e.append(code([
        "[DEFAULT]",
        "bantime  = 3600      # ban IP for 1 hour",
        "findtime = 600       # within 10 minute window",
        "maxretry = 3         # after 3 failed attempts",
        "",
        "[sshd]",
        "enabled = true",
        "port    = 22",
        "",
        "[nginx-limit-req]",
        "enabled  = true",
        "filter   = nginx-limit-req",
        "logpath  = /var/log/nginx/error.log",
        "maxretry = 10",
    ]))
    e.append(sp(4))
    e.append(code([
        "sudo systemctl enable fail2ban",
        "sudo systemctl start fail2ban",
        "",
        "# Check banned IPs",
        "sudo fail2ban-client status sshd",
        "",
        "# Unban an IP if needed",
        "sudo fail2ban-client set sshd unbanip 1.2.3.4",
    ]))
    e.append(sp(8))

    e.append(h3("11.4 Automatic Security Updates"))
    e.append(code([
        "sudo apt install -y unattended-upgrades",
        "sudo dpkg-reconfigure --priority=low unattended-upgrades",
        "# Select 'Yes' when prompted",
        "",
        "# Verify it's configured",
        "cat /etc/apt/apt.conf.d/20auto-upgrades",
    ]))
    e.append(PageBreak())
    return e

# ── 12. Debug ─────────────────────────────────────────────────────────
def s12():
    e = []
    e.append(section_header("12","Debug & Troubleshoot","Common errors and how to fix them"))
    e.append(sp(6))

    e.append(h3("12.1 Docker Debug Commands"))
    e.append(code([
        "# Check container status",
        "docker compose ps",
        "",
        "# Follow live logs (all services)",
        "docker compose logs -f",
        "",
        "# Follow logs for one service",
        "docker compose logs -f api",
        "docker compose logs -f nginx",
        "",
        "# Last 100 lines",
        "docker compose logs --tail=100 api",
        "",
        "# Enter running container (bash shell)",
        "docker exec -it commilk_api bash",
        "",
        "# If no bash (alpine image)",
        "docker exec -it commilk_api sh",
        "",
        "# Check container resource usage",
        "docker stats",
        "",
        "# Inspect container full details",
        "docker inspect commilk_api",
        "",
        "# View image layers / size",
        "docker images",
        "docker system df",
    ]))
    e.append(sp(8))

    e.append(h3("12.2 Common Errors and Fixes"))
    e.append(tbl(
        ["Error / Symptom", "Cause", "Fix"],
        [
            ["Container keeps restarting",
             "App crash / missing env var",
             "docker compose logs api — read the error. Check .env file has all required values."],
            ["Port already in use",
             "Another process on port 80/443/8000",
             "sudo netstat -tlnp | grep PORT — then sudo kill -9 PID"],
            ["Permission denied on .pem key",
             "Key file permissions too open",
             "chmod 400 ~/your-key.pem"],
            ["Nginx 502 Bad Gateway",
             "Backend not running or wrong port",
             "Check docker compose ps. Verify proxy_pass port matches backend port."],
            ["SSL certificate fails",
             "Domain DNS not pointed to EC2",
             "Check: dig api.yourdomain.com — should return EC2 IP. Wait for DNS propagation."],
            ["docker: permission denied",
             "User not in docker group",
             "sudo usermod -aG docker $USER && newgrp docker"],
            ["git pull fails on EC2",
             "SSH key not added to GitHub",
             "Run: ssh-keygen and add public key to GitHub → Settings → SSH keys"],
            ["Out of disk space",
             "Old Docker images accumulated",
             "docker system prune -a -f"],
            ["Out of memory / OOM kill",
             "Not enough RAM for workload",
             "Add swap memory. Upgrade to t3.small or larger."],
            ["FastAPI workers crash",
             "Too many workers for RAM",
             "Reduce --workers to 2 in uvicorn CMD"],
        ],
        widths=[42*mm, 40*mm, PW-84*mm]
    ))
    e.append(sp(8))

    e.append(h3("12.3 FastAPI Specific Debug"))
    e.append(code([
        "# Check systemd service status",
        "sudo systemctl status commilk-api",
        "",
        "# Follow live logs",
        "sudo journalctl -u commilk-api -f",
        "",
        "# Last 50 log lines",
        "sudo journalctl -u commilk-api -n 50",
        "",
        "# Logs since last hour",
        "sudo journalctl -u commilk-api --since '1 hour ago'",
        "",
        "# Test API directly (bypass Nginx)",
        "curl http://localhost:8000/health",
        "curl http://localhost:8000/api/v1/",
        "",
        "# Check which process is using port 8000",
        "sudo ss -tlnp | grep 8000",
        "",
        "# Manually run FastAPI to see startup errors",
        "source /home/deploy/commilk/.venv/bin/activate",
        "cd /home/deploy/commilk/backend",
        "uvicorn app.main:app --host 0.0.0.0 --port 8001",
        "# Using 8001 to avoid conflict — check terminal for errors",
    ]))
    e.append(sp(8))

    e.append(h3("12.4 Node.js / PM2 Specific Debug"))
    e.append(code([
        "# PM2 process status",
        "pm2 status",
        "",
        "# Follow live logs",
        "pm2 logs commilk-api",
        "",
        "# Last 100 log lines",
        "pm2 logs commilk-api --lines 100",
        "",
        "# Open live dashboard",
        "pm2 monit",
        "",
        "# Full process info",
        "pm2 describe commilk-api",
        "",
        "# Test Node app directly",
        "node /home/deploy/commilk-node/src/server.js",
        "",
        "# Check environment variables PM2 sees",
        "pm2 env 0",
        "",
        "# Check port 3000",
        "sudo ss -tlnp | grep 3000",
        "curl http://localhost:3000/health",
    ]))
    e.append(sp(8))

    e.append(h3("12.5 Nginx Debug"))
    e.append(code([
        "# Test nginx config before applying",
        "sudo nginx -t",
        "",
        "# Reload config without downtime",
        "sudo systemctl reload nginx",
        "",
        "# Full restart",
        "sudo systemctl restart nginx",
        "",
        "# Follow access logs",
        "sudo tail -f /var/log/nginx/access.log",
        "",
        "# Follow error logs",
        "sudo tail -f /var/log/nginx/error.log",
        "",
        "# Test from outside (replace with your domain)",
        "curl -I https://api.yourdomain.com/health",
        "",
        "# Check if nginx is running",
        "sudo systemctl status nginx",
        "sudo ss -tlnp | grep nginx",
    ]))
    e.append(PageBreak())
    return e

# ── 13. Quick Reference ───────────────────────────────────────────────
def s13():
    e = []
    e.append(section_header("13","Quick Reference Commands","Daily operations — monitor · update · maintain"))
    e.append(sp(6))

    e.append(h3("System Monitoring"))
    e.append(tbl(
        ["Command", "Purpose"],
        [
            ["htop",                              "Live CPU, RAM, process viewer"],
            ["df -h",                             "Disk space usage"],
            ["free -h",                           "Memory and swap usage"],
            ["sudo ss -tlnp",                     "Open ports and listening processes"],
            ["who / last",                        "Who is logged in / login history"],
            ["sudo tail -f /var/log/auth.log",    "SSH login attempts (watch for attacks)"],
            ["sudo fail2ban-client status sshd",  "Banned IPs"],
            ["uptime",                            "Server uptime and load average"],
        ],
        widths=[72*mm, PW-74*mm]
    ))
    e.append(sp(8))

    e.append(h3("Docker Operations"))
    e.append(tbl(
        ["Command", "Purpose"],
        [
            ["docker compose ps",                              "Status of all containers"],
            ["docker compose logs -f api",                     "Follow API logs live"],
            ["docker compose restart api",                     "Restart API container"],
            ["docker compose up -d --build --no-deps api",     "Rebuild and restart API only"],
            ["docker compose down",                            "Stop all containers"],
            ["docker stats",                                   "Live container resource usage"],
            ["docker system df",                               "Docker disk usage breakdown"],
            ["docker system prune -f",                         "Remove unused images/containers"],
            ["docker exec -it commilk_api bash",               "Shell into running container"],
            ["docker inspect commilk_api | grep Status",       "Container health status"],
        ],
        widths=[88*mm, PW-90*mm]
    ))
    e.append(sp(8))

    e.append(h3("Nginx + SSL"))
    e.append(tbl(
        ["Command", "Purpose"],
        [
            ["sudo nginx -t",                       "Test config syntax"],
            ["sudo systemctl reload nginx",         "Apply config changes (no downtime)"],
            ["sudo tail -f /var/log/nginx/error.log","Error log — shows 502s and rate limits"],
            ["sudo certbot renew --dry-run",        "Test SSL renewal"],
            ["sudo certbot certificates",           "List all SSL certificates"],
        ],
        widths=[72*mm, PW-74*mm]
    ))
    e.append(sp(8))

    e.append(h3("Go-Live Final Checklist"))
    e.append(tbl(
        ["#", "Checklist Item", "Done?"],
        [
            ["1",  "Elastic IP assigned to EC2 instance",            "[ ]"],
            ["2",  "Domain A record → EC2 Elastic IP",               "[ ]"],
            ["3",  "UFW firewall ON — only ports 22, 80, 443 open",  "[ ]"],
            ["4",  "SSH password auth disabled — key-only",          "[ ]"],
            ["5",  ".env file filled in with all secrets",           "[ ]"],
            ["6",  "Nginx reverse proxy configured and running",     "[ ]"],
            ["7",  "SSL certificate active — HTTPS works",           "[ ]"],
            ["8",  "Systemd (FastAPI) or PM2 (Node) auto-start ON",  "[ ]"],
            ["9",  "Fail2Ban service running",                       "[ ]"],
            ["10", "GitHub Actions CI/CD pipeline working",          "[ ]"],
            ["11", "/health endpoint returns 200",                   "[ ]"],
            ["12", "docker compose logs clean — no ERROR lines",     "[ ]"],
            ["13", "Swap memory configured (min 2GB)",               "[ ]"],
            ["14", "Tested full deploy: git push → auto deploys",    "[ ]"],
        ],
        widths=[10*mm, 108*mm, 22*mm]
    ))
    return e

# ── Build ─────────────────────────────────────────────────────────────
output = "/mnt/user-data/outputs/EC2_Backend_Deployment_Guide_v2.pdf"

doc = SimpleDocTemplate(
    output,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=22*mm,
    bottomMargin=20*mm,
)

story = []
story += cover()
story += s1()
story += s2()
story += s3()
story += s4()
story += s5()
story += s6()
story += s7()
story += s8()
story += s9()
story += s10()
story += s11()
story += s12()
story += s13()

doc.build(story, onFirstPage=hf, onLaterPages=hf)
print(f"Done: {output}")