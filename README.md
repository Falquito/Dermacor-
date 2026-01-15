# 🏥 DermaCor - Sistema de Gestión de Pacientes

Sistema para la gestión integral de pacientes en el centro dermatologico, desarrollado por un equipo de 4 personas.

## 📋 Descripción del Proyecto

Dermacor es una aplicación web moderna que permite:
- **Gestión de Pacientes**: Registro, historial y datos médicos.

## 🚀 Tecnologías

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework CSS utility-first
- **Prisma** - ORM moderno para bases de datos
- **PostgreSQL** - Base de datos relacional
- **Docker** - Contenerización y desarrollo

## 📋 Requisitos previos

- Node.js 20+
- npm o yarn
- Docker y docker-compose

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd Dermacor-
```

2. Instala las dependencias:
```bash
npm i
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Inicia la base de datos con Docker:
```bash
docker-compose up -d
```

5. Ejecuta las migraciones de Prisma:
```bash
npm run prisma:migrate
npm run prisma:generate
```

6. (Opcional) Ejecuta el seed:
```bash
npm run db:seed
```

## 🏃‍♂️ Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.



## 📁 Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run prisma:migrate` - Ejecuta las migraciones de Prisma
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run db:seed` - Ejecuta el seed de la base de datos

## 🗃️ Base de datos

El proyecto utiliza PostgreSQL con Prisma como ORM. La configuración de Docker incluye una instancia de PostgreSQL lista para desarrollo.

## 📝 Estructura del proyecto

```
carelink/
├── src/
│   ├── app/                 # App Router de Next.js
│   ├── components/          # Componentes reutilizables
│   └── lib/                 # Utilidades y configuración
├── prisma/                  # Esquemas y migraciones de Prisma
├── public/                  # Archivos estáticos
└── docker-compose.yml       # Configuración de Docker
```
## Licencia y Derechos de Uso

**Copyright © 2026 Centro Dermatologico. Todos los derechos reservados.**

Este software es propiedad exclusiva de Centro Dermatologico.
Queda prohibida su distribución, copia, modificación o uso por terceros sin autorización expresa y por escrito del titular..
