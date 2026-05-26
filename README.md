# EDU ClassRepo

Academic resource hub for East Delta University. Students can browse courses, upload study materials, and generate assignment cover pages. Admins moderate uploaded files before they go live.

**Live:** [edu-class-repo-pi.vercel.app](https://edu-class-repo-pi.vercel.app)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Spring Boot 3.4, Java 21 |
| Database | PostgreSQL (Supabase) with Flyway migrations |
| Auth | JWT (access + refresh token rotation) + OTP email verification |
| Storage | Cloudflare R2 (S3-compatible) |
| Deploy | Vercel (frontend) · Render (backend) |

---

## Features

- **Course repository** — browse and search all EDU courses by department
- **Material uploads** — students upload PDFs/docs, admin approves before publishing
- **Enrollment** — enroll in courses to track your subjects
- **Cover page generator** — auto-fills assignment cover pages from your profile
- **Admin panel** — approve/reject/rename pending materials, manage courses
- **OTP email verification** — required on registration, restricted to `@eastdelta.edu.bd`

---

## Project Structure

```
EDU-ClassRepo/
├── frontend/               # Next.js app
│   ├── app/                # Pages (App Router)
│   ├── components/         # Shared UI components
│   └── lib/                # API client, auth store
└── backend/                # Spring Boot API
    └── src/main/java/com/edu/classrepo/
        ├── config/         # Security, storage, scheduling
        ├── controller/     # REST endpoints
        ├── service/        # Business logic
        ├── entity/         # JPA entities
        ├── repository/     # Spring Data repositories
        ├── security/       # JWT filter + token provider
        └── dto/            # Request/response DTOs
```

---

## Local Development

### Backend

Requires Java 21 and a PostgreSQL database.

```bash
cd backend
cp .env.example .env   # fill in your values
./mvnw spring-boot:run
```

Key environment variables:

```
DATABASE_URL=jdbc:postgresql://localhost:5432/classrepo
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
JWT_SECRET=your64charSecret
MAIL_USERNAME=you@gmail.com
MAIL_PASSWORD=yourAppPassword
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=your-bucket
R2_PUBLIC_URL=https://pub-xxx.r2.dev
GEMINI_API_KEY=...
CORS_ALLOWED_ORIGINS=http://localhost:3000
ADMIN_DEFAULT_PASSWORD=yourAdminPassword
ADMIN_EMAIL_1=admin@eastdelta.edu.bd
ADMIN_NAME_1=Admin
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

---

## Deployment

Backend is Docker-based with a `render.yaml` for one-click Render deploy.
Frontend deploys to Vercel — set root directory to `frontend`.

See [render.yaml](backend/render.yaml) for the full environment variable list.

---

## Author

**Syed Nazmus Sakib** — [github.com/sakib-101-git](https://github.com/sakib-101-git)
