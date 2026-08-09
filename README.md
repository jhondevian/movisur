# Movisur

Movisur es una plataforma web basada en Next.js para administrar descargas, productos, licencias, alquiler de tools, usuarios, creadores y compras.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma

## Requisitos

- Node.js 20 o superior
- PostgreSQL
- npm

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo `.env.local` usando `.env.example` como base:

```bash
cp .env.example .env.local
```

3. Configura las variables:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/movisur"
AUTH_SECRET="coloca-un-secreto-largo-y-seguro"
NEXT_PUBLIC_SITE_URL="https://tudominio.com"
```

4. Aplica migraciones:

```bash
npx prisma migrate deploy
```

5. Genera Prisma Client:

```bash
npx prisma generate
```

6. Ejecuta en desarrollo:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

## Estructura Principal

- `src/app`: rutas de frontend, admin, usuario, creador y APIs.
- `src/components`: componentes reutilizables.
- `src/layout`: layout del panel.
- `src/lib`: autenticacion, Prisma, roles, helpers y reglas de negocio.
- `prisma`: schema, migraciones y seed.
- `public/images`: imagenes publicas del sitio.

## Notas Para Git

No se deben subir:

- `.env.local`
- `.env`
- `.next`
- `node_modules`
- `public/uploads`
- `src/generated/prisma`

`src/generated/prisma` se genera automaticamente con `npm install` gracias al script `postinstall`.
