import "dotenv/config";
// Environment validation - must be imported early to fail fast on invalid config
import env from "./config/env";
import { app } from "./app";

console.log(`✅ Environment: ${env.NODE_ENV}`);
if (env.NODE_ENV === "production") {
  console.log("✅ Security: ADMIN_API_TOKEN is configured");
  console.log("✅ Security: APP_SECRET is configured");
}

// start server
app.listen(env.PORT, () => {
  console.log(`API server listening on http://localhost:${env.PORT}`);
});
