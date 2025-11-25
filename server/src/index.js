import app from "./app.js";
import { appPort } from "./config/env.js";
import { startEmailProcessor } from "./services/email.service.js";

app.listen(appPort, () => {
  console.log(`Server listening on port ${appPort}`);
  startEmailProcessor();
});