import { readFile, writeFile, chmod, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/admin-auth.js";

const envFile = new URL("../.env", import.meta.url);
const credentialFile = new URL("../.admin-local.txt", import.meta.url);
let contents = await readFile(envFile, "utf8").catch(() => "");
if (
  /^ADMIN_PASSWORD_HASH=.+$/m.test(contents) &&
  !process.argv.includes("--rotate")
) {
  throw new Error(
    "An admin is already configured. Use npm run admin:setup -- --rotate to invalidate existing sessions and generate a new password.",
  );
}
const username = "operator";
const password = randomBytes(24).toString("base64url");
const hash = await hashPassword(password);
contents = contents
  .replace(/^ADMIN_(?:USERNAME|PASSWORD_HASH)=.*\n?/gm, "")
  .trimEnd();
contents +=
  "\nADMIN_USERNAME=" + username + "\nADMIN_PASSWORD_HASH=" + hash + "\n";
const temp = new URL("../.env.admin.tmp", import.meta.url);
await writeFile(temp, contents, { mode: 0o600 });
await chmod(temp, 0o600);
await rename(temp, envFile);
await writeFile(
  credentialFile,
  "AfterClass local admin\nUsername: " +
    username +
    "\nPassword: " +
    password +
    "\n\nSave this password in your password manager, then delete this file.\nNever upload this file. The application uses only the salted hash in .env.\nRun npm run admin:setup -- --rotate to replace the password. Restart the service after rotating.\n",
  { mode: 0o600 },
);
await chmod(credentialFile, 0o600);
console.info(
  "Admin configured. Read backend/.admin-local.txt privately, save the password and remove that file. Restart the API or test preview. No credentials were printed.",
);
