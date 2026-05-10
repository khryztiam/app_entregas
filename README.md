# OnHand Hub

Aplicación web para gestión centralizada de artículos, entregas y préstamos.

**Estado**: 🚀 Desarrollo

## Inicio rápido

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Stack

- Next.js (Pages Router)
- React 19
- TypeScript/JavaScript
- Prisma ORM + PostgreSQL
- JWT + Autenticación local
- CSS Modules

## Configuración

Variables requeridas en `.env.local`:
- `DATABASE_URL`: Cadena de conexión PostgreSQL
- `AUTH_SECRET`: Clave de 32+ caracteres para JWT
- `NEXT_PUBLIC_APP_NAME`: Nombre de la aplicación

## Comandos

```bash
npm run dev              # Servidor local
npm run build            # Generar build
npm run lint             # Verificar código
npm run test             # Ejecutar tests
```

## Rutas principales

- `/`: Autenticación
- `/dashboard`: Visualización de datos
- `/admin`: Panel administrativo
- `/api/*`: Endpoints internos (requieren JWT)

## Estructura del proyecto

```
src/
├── components/    # Componentes UI
├── config/        # Configuración
├── context/       # Context de React
├── lib/           # Utilidades y ORM
├── pages/         # Rutas y APIs
└── styles/        # Estilos CSS
```

## Base de datos

Gestión via Prisma. Consultar `prisma/schema.prisma` para detalles del esquema.

## Configuración para terceros

### Integraciones externas

El proyecto está diseñado para ser genérico y permitir implementaciones de terceros:

1. **Sanitización de datos**: Usa contexto `'partner'` para APIs de terceros
2. **Validaciones personalizadas**: Extiende `validators.js` según necesidad
3. **Branding configurable**: Ver [src/config/branding.js](./src/config/branding.js)

### Variables de configuración para partners

```env
# Para partner específico
PARTNER_ID=partner-name
PARTNER_COLORS_PRIMARY=#custom-color
PARTNER_DOMAIN=custom.domain.com
```

Luego en servicios:

```typescript
const context = process.env.PARTNER_ID ? 'partner' : 'secure';
const data = adaptPersonFromDb(person, context);
```

## Estilos

El proyecto usa CSS Modules y archivos globales en `src/styles`. No usa Tailwind.

Importar estilos en componentes:

```javascript
import styles from './component.module.css';

export function Component() {
  return <div className={styles.container}>{content}</div>;
}
```

## Validación básica

Antes de cerrar cambios funcionales:

```bash
npm run lint
npm run build
npm run db:migrate --dry-run  # Vista previa de cambios de BD
```


## Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

