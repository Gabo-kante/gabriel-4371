# Snail Racing

Aplicación web de ejemplo con temática de apuestas en carreras de caracoles.
Frontend en React, backend en Express, ambos con TypeScript. Incluye registro e
inicio de sesión simulados en el navegador, un dashboard con gráficas simuladas y
recarga de saldo mediante **SnailPay**, una pasarela de pagos simulada.

> Todos los datos de tarjetas son ficticios. No ingreses información financiera real.

## Requisitos

- Node.js 20.19 o superior (o 22.12+) y npm.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Esto levanta ambos servicios a la vez:

| Servicio | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

El frontend reenvía las peticiones `/api/*` al backend mediante el proxy de Vite.

Variables de entorno opcionales del backend (se leen del entorno del proceso):

| Variable | Efecto | Valor por defecto |
|---|---|---|
| `PORT` | Puerto del backend | `3001` |
| `CLIENT_ORIGIN` | Origen permitido por CORS | `http://localhost:5173` |
| `SNAILPAY_FORCE_DOWN` | `true` simula la caída de SnailPay | desactivada |
| `SNAILPAY_SLOW_MS` | Milisegundos de demora del monto `13.13` | `12000` |

## Pruebas

```bash
npm test                  # servidor y cliente
npm run test -w server    # solo servidor (Vitest + Supertest)
npm run test -w client    # solo cliente (Vitest + Testing Library)
```

Otros comandos útiles: `npm run build` y `npm run lint -w client`.

## Uso rápido

1. Abre http://localhost:5173 y crea una cuenta (el saldo inicial es $0).
2. En el dashboard pulsa **Recargar saldo**.
3. Usa **Autocompletar tarjeta de prueba**, escribe un nombre y un monto.

## SnailPay: cómo reproducir cada respuesta

Endpoint: `POST /api/snailpay/charges`

Campos de la petición: `card_number`, `expiration_date` (`MM/AA`), `cvv`,
`cardholder_name`, `amount` (número), `payer_id`, `payer_email`.

Todas las respuestas, exitosas o no, tienen la misma estructura: `id`, `status`,
`status_detail`, `transaction_amount`, `date_created`, `authorization_code`
(solo en cobros aprobados), `reference`, `payer_id`, `payer_email`, `card_number` y `cvv`.
Estos dos últimos se devuelven porque la especificación lo pide; son siempre datos ficticios.

| Escenario | Datos que lo provocan | HTTP | `status` | `status_detail` |
|---|---|---|---|---|
| Cobro exitoso | Tarjeta `1234123412341234`, vence `12/26`, CVV `543`, nombre no vacío, monto > 0 | 201 | `approved` | `accredited` |
| Tarjeta mal formada | Número que no tiene 16 dígitos | 400 | `rejected` | `invalid_card_number` |
| Fecha mal formada | Fecha que no cumple `MM/AA` (por ejemplo `13/26`) | 400 | `rejected` | `invalid_expiration_date` |
| CVV mal formado | CVV de menos de 3 o más de 4 dígitos | 400 | `rejected` | `invalid_security_code` |
| Nombre vacío | `cardholder_name` vacío | 400 | `rejected` | `invalid_cardholder_name` |
| Monto inválido | Monto en cero, negativo, con más de 2 decimales, mayor a 50,000 o no numérico | 400 | `rejected` | `invalid_amount` |
| Pagador inválido | Correo con formato inválido o `payer_id` vacío | 400 | `rejected` | `invalid_payer` |
| JSON mal formado | Cuerpo que no es JSON válido | 400 | `rejected` | `invalid_request` |
| CVV incorrecto | Tarjeta de éxito con otro CVV | 402 | `rejected` | `bad_security_code` |
| Fecha incorrecta | Tarjeta de éxito con otra fecha | 402 | `rejected` | `bad_expiration_date` |
| Tarjeta vencida | Otra tarjeta con fecha pasada, por ejemplo `01/20` | 402 | `rejected` | `expired_card` |
| Fondos insuficientes | Tarjeta `4000000000009995` | 402 | `rejected` | `insufficient_funds` |
| Tarjeta rechazada | Tarjeta `4000000000000002` o cualquier otra tarjeta bien formada | 402 | `rejected` | `card_declined` |
| Demasiadas peticiones | Más de 30 cobros por minuto desde la misma IP | 429 | `error` | `too_many_requests` |
| Sistema caído | Header `X-Simulate-Outage: true` o `SNAILPAY_FORCE_DOWN=true` | 503 | `error` | `service_unavailable` |
| Respuesta lenta | Monto `13.13` (responde a los 12 s; el cliente se rinde a los 8 s) | 201 | `approved` | `accredited` |

Reglas generales: los códigos `invalid_*` indican un dato mal formado; los `bad_*`, un
dato bien formado que no coincide. Cuando un cobro no es aprobado, el saldo no se modifica.

### Reproducirlo desde la interfaz

- **Rechazos:** en el formulario de recarga cambia el CVV, la fecha o el número de tarjeta
  según la tabla.
- **Caída del sistema:** marca la casilla *Simular caída de SnailPay*.
- **Timeout:** usa la tarjeta de éxito con el monto `13.13`. A los 8 segundos la interfaz
  informa que no pudo confirmar la operación y el saldo no cambia.
- **Caída global:** arranca el backend con la variable `SNAILPAY_FORCE_DOWN=true`.

### Reproducirlo con curl (PowerShell)

```powershell
@'
{"card_number":"1234123412341234","expiration_date":"12/26","cvv":"543","cardholder_name":"Ana Perez","amount":250,"payer_id":"user-1","payer_email":"ana@example.com"}
'@ | curl.exe -i -X POST http://localhost:3001/api/snailpay/charges -H "Content-Type: application/json" --data-binary "@-"
```

Para otros escenarios cambia el campo indicado en la tabla. Para la caída del sistema agrega
`-H "X-Simulate-Outage: true"`. Para caída global:

```powershell
$env:SNAILPAY_FORCE_DOWN = "true"
npm run dev -w server
Remove-Item Env:SNAILPAY_FORCE_DOWN   # al terminar
```

## Estructura

```
client/   React + Vite + TypeScript + Tailwind + shadcn/ui
  src/app/                 guards de rutas
  src/features/auth/       registro, login, hash de contraseña, sesión
  src/features/wallet/     cliente SnailPay, saldo, formulario de recarga
  src/features/dashboard/  gráficas y datos simulados
  src/shared/              storage tipado, formato de dinero, componentes comunes
server/   Express + TypeScript
  src/routes, controllers, services, middleware, schemas, types
```

## Decisiones y limitaciones

- **Autenticación simulada:** usuarios y sesión viven en `localStorage`. La contraseña se
  guarda con PBKDF2 (SHA-256), sal aleatoria por usuario e iteraciones registradas. En
  producción esto debe hacerse en el servidor con bcrypt o argon2.
- **Tarjeta y CVV en `localStorage`:** la especificación lo exige. Es inseguro en un
  sistema real; aquí solo se aceptan datos ficticios. La tarjeta se guarda únicamente
  cuando el cobro es aprobado.
- **Saldo en centavos enteros** para evitar errores de redondeo. Cada operación aprobada
  se acredita una sola vez, y se rechaza una respuesta cuyo `payer_id` no sea el del usuario.
- **Timeout:** si SnailPay tarda más de 8 segundos, el resultado es incierto y no se
  acredita nada. Una solución completa requeriría una clave de idempotencia y una consulta
  del estado de la operación.
- **Datos del dashboard:** 6 caracoles, 6 carreras con un ganador cada una y 12 apuestas
  fijas. Las gráficas se calculan a partir de esos datos, así que son coherentes entre sí.