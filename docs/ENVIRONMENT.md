# Environment Variables

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: signing secret for auth/JWT
- `NEXTAUTH_URL`: public base URL used for auth links
- `SENDGRID_API_KEY`: optional SendGrid integration
- `RESEND_API_KEY`: optional Resend integration

Development defaults are provided in `.env.local` and templates in `.env.example`.
