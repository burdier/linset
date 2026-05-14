# Deuditas

Una app sencilla y bonita hecha con Vue para trackear deudas, pagos y progreso desde el navegador.

## Qué puedes hacer

- Crear deudas como "pagar el carro", tarjetas, préstamos o compras grandes.
- Registrar pagarés/pagos con cantidad, fecha y nota.
- Ver progreso visual, balance pendiente, total pagado y porcentaje completado.
- Guardar todo en `localStorage`, ideal para Netlify sin configurar backend.
- Exportar/importar un respaldo JSON para mover tus datos entre navegadores o equipos.

> Nota: Netlify puede publicar esta app como sitio estático. Para guardar data multi-dispositivo haría falta agregar un backend o Netlify Functions + una base de datos/Blobs, pero para algo simple y sin complicaciones `localStorage` es lo más directo.

## Correr local

```bash
npm install
npm run dev
```

## Build para Netlify

```bash
npm run build
```

Netlify detecta `netlify.toml`, corre el build y publica la carpeta `dist`.
