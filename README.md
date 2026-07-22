# ClearView Blog

Plataforma de blog full-stack con frontend en React / Vite y backend en Node.js / Express respaldada por MySQL.

## Resumen del proyecto

ClearView Blog incluye:
- Página principal pública con publicaciones buscables y filtrables
- Página de detalle de publicación con posts relacionados y soporte autenticado de Me gusta/no Me gusta
- Panel administrativo para gestionar categorías y publicaciones
- Autenticación con JWT en cookies y rutas admin protegidas
- Subida de imágenes de publicaciones usando Cloudinary
- Registros eliminados lógicamente mediante la bandera `archived` en el esquema MySQL

## Estructura del repositorio

- `backend/`
  - `src/index.js` — configuración del servidor Express y registro de rutas
  - `src/routes/` — definiciones de rutas API
  - `src/controllers/` — lógica de negocio para auth, categorías, publicaciones y likes
  - `src/lib/` — utilidades de base de datos, Cloudinary y auth
  - `src/models/` — serializadores de respuesta
- `frontend/`
  - `src/App.jsx` — router de React y control de autenticación
  - `src/pages/` — páginas del cliente para inicio, detalle, auth y administración
  - `src/components/` — componentes de UI compartidos
  - `src/store/` — stores de Zustand para auth, categorías y publicaciones
  - `src/lib/axios.js` — configuración de Axios para llamadas a la API del backend
- `blog.sql` — volcado MySQL usado para poblar el esquema `blog` y datos de ejemplo

## Configuración del backend

### Requisitos

- Node.js
- MySQL / MariaDB
- npm
- Cuenta de Cloudinary para subir imágenes de publicaciones

### Variables de entorno necesarias

Crea un archivo `.env` dentro de `backend/` con:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=<tu_usuario_mysql>
DB_KEY=<tu_contraseña_mysql>
DB_NAME=blog
JWT_SECRET=<secreto_fuerte>
CLOUDINARY_CLOUD_NAME=<cloudinary_cloud_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
```

Notas:
- `DB_KEY` es la contraseña de MySQL.
- `FRONTEND_URL` debe coincidir con el origen del frontend en desarrollo.
- `JWT_SECRET` protege las cookies de autenticación.

### Instalar y ejecutar

```bash
cd backend
npm install
npm run dev
```

El backend escucha en el puerto definido en `PORT` y expone las APIs bajo `/api`.

## Configuración del frontend

### Requisitos

- Node.js
- npm

### Instalar y ejecutar

```bash
cd frontend
npm install
npm run dev
```

La URL de desarrollo por defecto es `http://localhost:5173`.

### Configuración de la API

El frontend usa `frontend/src/lib/axios.js` con la URL base del backend por defecto `http://localhost:3000/api`.
Si el backend se ejecuta en otro puerto u host, actualiza `baseURL` allí.

## Referencia de la API

### Autenticación

- `POST /api/auth/signup`
  - Body: `{ fullName, email, password }`
  - Crea un nuevo usuario y establece una cookie `jwt`.

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Autentica al usuario y establece una cookie `jwt`.

- `POST /api/auth/logout`
  - Limpia la cookie de autenticación.

- `GET /api/auth/check`
  - Requiere cookie de auth.
  - Devuelve el perfil del usuario actual: `{ _id, fullName, email, role, profilePic }`.

### Publicaciones

- `GET /api/publications`
  - Endpoint público con autenticación opcional.
  - Query params:
    - `page` (por defecto `1`)
    - `limit` (por defecto `10`)
    - `search`
    - `category` (ID de categoría)
    - `sortBy` (`date` o `title`, por defecto `date`)
    - `sortOrder` (`asc` o `desc`, por defecto `desc`)
  - La respuesta incluye `publications` y `pagination`.

- `GET /api/publications/:id`
  - Requiere usuario autenticado.
  - Devuelve una publicación con `content` completo y `relatedPosts`.

- `POST /api/publications`
  - Solo admin.
  - Body: `{ title, excerpt, content, categoryIds, featuredImage }`
  - `featuredImage` debe ser un objeto con `{ data, mimeType, fileName }`.

- `PUT /api/publications/:id`
  - Solo admin.
  - Body: `{ title, excerpt, content, categoryIds, featuredImage? }`
  - `featuredImage` puede omitirse para conservar la imagen actual.

- `DELETE /api/publications/:id`
  - Solo admin.

### Likes

- `POST /api/likes/:postId`
  - Usuarios autenticados que no son admin pueden dar Me gusta o restaurar un Me gusta.

- `DELETE /api/likes/:postId`
  - Usuarios autenticados que no son admin pueden quitar su Me gusta.

### Categorías

- `GET /api/categories`
  - Endpoint público para listas de categorías.

- `GET /api/categories/:id`
  - Endpoint público para detalles de categoría.

- `POST /api/categories`
  - Solo admin.
  - Body: `{ name, description }`

- `PUT /api/categories/:id`
  - Solo admin.

- `DELETE /api/categories/:id`
  - Solo admin.

## Modelos de datos

### Publicaciones

Estructura de respuesta para objetos de publicación:

```json
{
  "id": 1,
  "title": "...",
  "excerpt": "...",
  "featuredImageUrl": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "author": "...",
  "likesCount": 0,
  "categories": [{ "id": 1, "name": "Horror" }],
  "likedByCurrentUser": false,
  "content": "..." // solo presente en el detalle de publicación
}
```

### Categorías

```json
{
  "id": 1,
  "name": "Horror",
  "description": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Sesión de usuario

```json
{
  "_id": 28,
  "fullName": "admin",
  "email": "admin22@gmail.com",
  "role": "admin",
  "profilePic": null
}
```

## Esquema de base de datos (desde `blog.sql`)

El volcado SQL define una base de datos `blog` que contiene estas tablas principales:

- `roles`
  - Roles iniciales: `user`, `admin`, `visitor`.

- `users`
  - Almacena cuentas con `role_id`, `full_name`, `email` y `password_hash`.
  - El volcado incluye un usuario admin de ejemplo.

- `categories`
  - Categorías del blog con descripciones opcionales.

- `posts`
  - Publicaciones creadas por usuarios, con `excerpt`, `content` y `featured_image_url`.

- `post_categories`
  - Asociación muchos a muchos entre publicaciones y categorías.

- `post_likes`
  - Likes de usuarios sobre publicaciones.

Todas las tablas usan la bandera `archived` para eliminación lógica.

### Notas de importación SQL

El encabezado de `blog.sql` menciona `Database: blog`, pero no crea explícitamente la base de datos. Antes de importar, crea el esquema manualmente si es necesario.

#### Importación con MySQL CLI

```bash
mysql -u <tu_usuario_mysql> -p
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blog;
SOURCE /ruta/a/blog.sql;
```

O desde shell:

```bash
mysql -u <tu_usuario_mysql> -p blog < /ruta/a/blog.sql
```

#### Importación con MySQL Workbench

1. Abre MySQL Workbench y conéctate a tu servidor.
2. Crea un esquema nuevo llamado `blog`.
3. Abre `blog.sql` en el editor SQL.
4. Ejecuta el archivo.

## Notas de desarrollo

- El backend usa `express`, `mysql2`, `jsonwebtoken`, `cookie-parser`, `dotenv` y `cloudinary`.
- La autenticación es mediante cookies: `jwt` se establece como cookie HTTP-only.
- `CORS` se configura usando `FRONTEND_URL` y `credentials: true`.
- El frontend usa React 19, Vite, Tailwind CSS, Axios, React Router v7, Zustand y react-hot-toast.
- La consulta de detalle de publicación requiere un usuario autenticado.
- Las rutas solo admin se protegen con middleware en `backend/src/middleware/auth.middleware.js`.

## Ejecutar el proyecto completo

1. Importa `blog.sql` en MySQL.
2. Crea `backend/.env` con los valores requeridos.
3. Inicia el backend:
   - `cd backend && npm install && npm run dev`
4. Inicia el frontend:
   - `cd frontend && npm install && npm run dev`
5. Abre `http://localhost:5173`.

## Solución de problemas

- Si las solicitudes del frontend fallan, verifica que `frontend/src/lib/axios.js` apunte a la URL correcta del backend.
- Si el backend no puede conectarse a MySQL, confirma `DB_USER`, `DB_KEY`, `DB_NAME` y la configuración de host/puerto.
- Si el inicio de sesión/auth falla, asegúrate de que `JWT_SECRET` esté presente y sea consistente entre reinicios del backend.
- Si la carga de imágenes falla, verifica las credenciales de Cloudinary.

