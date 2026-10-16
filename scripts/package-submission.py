"""Build the submission only after genuine links and Atlas exports are present."""
from pathlib import Path
from urllib.parse import urlparse
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    config_path = ROOT / "submission-links.json"
    require(config_path.is_file(), "Create submission-links.json from the example and enter actual hosted links.")
    links = json.loads(config_path.read_text())
    number = links.get("studentNumber", "").strip()
    require(number, "The actual student number is required.")
    keys = ["frontendRepository", "frontendUrl", "backendRepository", "lessonsUrl"]
    urls = {}
    for key in keys:
        value = links.get(key, "").strip()
        url = urlparse(value)
        require(url.scheme == "https" and url.hostname and not url.username and not url.password and not url.query and not url.fragment, "Enter a complete HTTPS URL for " + key)
        urls[key] = url
    require(urls["frontendRepository"].hostname == "github.com" and urls["backendRepository"].hostname == "github.com", "Use GitHub repository URLs.")
    require(links["frontendRepository"] != links["backendRepository"], "The repositories must be separate.")
    require(urls["frontendUrl"].hostname.endswith(".github.io"), "The frontend must be on GitHub Pages.")
    require(urls["lessonsUrl"].hostname.endswith(".onrender.com") and urls["lessonsUrl"].path == "/lessons", "Supply the Render /lessons URL.")
    require(number.lower() in urls["lessonsUrl"].hostname.lower(), "The Render hostname must contain your student number.")
    files = []
    for folder in ["frontend", "backend"]:
        repo = ROOT / folder
        count = int(subprocess.check_output(["git", "-C", str(repo), "rev-list", "--count", "HEAD"], text=True).strip())
        require(count >= 10, folder + " needs at least ten genuine development commits.")
        require(not subprocess.check_output(["git", "-C", str(repo), "status", "--porcelain"], text=True).strip(), folder + " has uncommitted changes; review and commit them before packaging.")
        tracked = subprocess.check_output(["git", "-C", str(repo), "ls-files", "-z"]).decode().split("\0")
        for name in filter(None, tracked):
            path = repo / name
            require(not path.is_symlink(), "Refusing to archive a symlink: " + name)
            require(".git" not in path.parts and "node_modules" not in path.parts and (not path.name.startswith(".env") or path.name == ".env.example"), "Refusing to include a secret or dependency path.")
            files.append((path, folder + "/" + name))
    manifest_path = ROOT / "exports" / "manifest.json"
    require(manifest_path.is_file(), "Run the actual Atlas export before packaging.")
    manifest = json.loads(manifest_path.read_text())
    require(manifest.get("source") == "MongoDB Atlas", "Atlas export metadata is required.")
    collections = manifest["collections"]
    require({"lesson", "order", "teacher"}.issubset({item["name"] for item in collections}), "Export lessons, orders and teachers.")
    for item in collections:
        name = item["file"]
        require(Path(name).name == name, "Invalid export filename.")
        path = ROOT / "exports" / name
        contents = path.read_bytes()
        require(hashlib.sha256(contents).hexdigest() == item["sha256"], "The export changed or is incomplete: " + name)
        require(len(json.loads(contents)) == item["count"], "Export count mismatch: " + name)
        files.append((path, "exports/" + name))
    files.append((manifest_path, "exports/manifest.json"))
    acknowledgement = ROOT / "AI_ACKNOWLEDGEMENT.md"
    require(acknowledgement.is_file(), "Include the completed assistance acknowledgement.")
    files.append((acknowledgement, "AI_ACKNOWLEDGEMENT.md"))
    postman = ROOT / "backend" / "postman" / "AfterClass.postman_collection.json"
    require(postman.is_file(), "Generate the Postman collection.")
    files.append((postman, "AfterClass.postman_collection.json"))
    readme = "# AfterClass — CST3144\n\n" + "\n".join("- " + key + ": " + links[key] for key in keys)
    readme += "\n\nStudent number: " + number + "\n\nBackend: Node 24; npm ci; configure .env; npm start. Frontend: serve its folder or open the GitHub Pages link. See both application READMEs for tests, API behaviour and attribution. Review and include the actual GenAI record. Paste the same four links into the submission text area.\n"
    output = ROOT / "output"
    output.mkdir(exist_ok=True)
    target = output / "AfterClass-submission.zip"
    temporary = output / "AfterClass-submission.zip.tmp"
    with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED) as archive:
        for path, name in files:
            archive.write(path, name)
        archive.writestr("README.md", readme)
    require(temporary.stat().st_size < 10_000_000, "The ZIP exceeds 10MB.")
    with zipfile.ZipFile(temporary) as archive:
        require(archive.testzip() is None, "ZIP integrity check failed.")
    temporary.replace(target)
    print("Submission ZIP created and checked:", target, target.stat().st_size, "bytes")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit("Submission not packaged: " + str(error))
