import app from "./app.js";
import { appPort } from "./config/env.js";

app.listen(appPort, () => {
  console.log(`API on port: ${appPort}`);
});

