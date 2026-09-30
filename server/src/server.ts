import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 3001);

createApp().listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});