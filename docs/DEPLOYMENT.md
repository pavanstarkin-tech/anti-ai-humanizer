# Deployment and Operations Guide

## 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested on Node.js v24.x)
- **Database**: MySQL 8.0+
- **Docker & Docker Compose** (for containerized deployments)

---

## 2. Local Setup and Execution

### Step 1: Clone and Configure Environment
```bash
cp .env.example .env
```

Configure your `.env` variables:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/humanizer_db"
JWT_SECRET="your-32-char-secure-jwt-secret-key"
DEFAULT_AI_PROVIDER="mock" # or "openai", "anthropic", "gemini"
OPENAI_API_KEY=""
```

### Step 2: Install Dependencies & Setup Prisma
```bash
npm install
npm run prisma:generate
```

### Step 3: Run Database Migrations
```bash
# Push schema directly to MySQL:
npm run prisma:push

# Or run migrations:
npm run prisma:migrate
```

### Step 4: Seed Initial Data
```bash
npm run prisma:seed
```
*Creates demo user: `demo@humanizer.ai` / `Password123!` and seeds the 10 domain and writing expert definitions.*

### Step 5: Start Application
```bash
# Starts Express API on :4000 and Vite React UI on :5173
npm run dev
```

---

## 3. Production Docker Deployment

To launch the complete containerized stack (MySQL + Express API + Nginx Web UI):
```bash
docker-compose up --build -d
```
- **Web UI**: `http://localhost:5173`
- **REST API**: `http://localhost:4000`
- **Swagger Documentation**: `http://localhost:4000/docs`
