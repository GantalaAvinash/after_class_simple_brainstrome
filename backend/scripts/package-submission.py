"""Package current source, real exports and evidence; never infer separate histories from a monorepo."""
from pathlib import Path, PurePosixPath
from urllib.parse import urlparse
import argparse
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def safe_name(name):
    path = PurePosixPath(name)
    require(name and not path.is_absolute() and ".." not in path.parts and "\\" not in name, "Unsafe archive path.")
    require(not any(part in [".git", "node_modules", "__pycache__", ".admin-local.txt", ".DS_Store"] or part.endswith(".pyc") or (part.startswith(".env") and part != ".env.example") for part in path.parts), "Refusing a private/dependency path: " + name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-workspace", type=Path, default=ROOT, help="Workspace containing the two independent frontend/backend Git checkouts")
    args = parser.parse_args()
    source = args.source_workspace.resolve()
    links = json.loads((ROOT / "submission-links.json").read_text())
    number = links.get("studentNumber", "").strip()
    require(number, "The actual student number is required.")
    urls = {}
    for key in ["frontendRepository", "frontendUrl", "backendRepository", "lessonsUrl"]:
        url = urlparse(links.get(key, "").strip())
        require(url.scheme == "https" and url.hostname and not url.username and not url.password and not url.query and not url.fragment, "Enter a complete HTTPS URL for " + key)
        urls[key] = url
    require(all(urls[key].hostname == "github.com" for key in ["frontendRepository", "backendRepository"]), "Use GitHub repository URLs.")
    require(links["frontendRepository"] != links["backendRepository"], "The coursework repositories must be separate.")
    require(urls["frontendUrl"].hostname.endswith(".github.io"), "The frontend must be on GitHub Pages.")
    require(urls["lessonsUrl"].hostname.endswith(".onrender.com") and urls["lessonsUrl"].path == "/lessons", "Supply the Render /lessons URL.")
    require(number.lower() in urls["lessonsUrl"].hostname.lower(), "The Render hostname must contain your student number.")
    files, provenance = {}, {}

    def add(path, name):
        safe_name(name)
        require(name not in files, "Duplicate archive entry: " + name)
        require(path.is_file() and not path.is_symlink(), "Missing file or symlink: " + name)
        files[name] = path.read_bytes()

    for folder in ["frontend", "backend"]:
        repo = source / folder
        require(Path(git(repo, "rev-parse", "--show-toplevel")).resolve() == repo.resolve(), "Use --source-workspace with two independent Git checkouts; monorepo totals are not separate development histories.")
        count = int(git(repo, "rev-list", "--count", "HEAD"))
        require(count >= 10, folder + " needs at least ten genuine development commits.")
        require(not git(repo, "status", "--porcelain"), folder + " has uncommitted changes.")
        require(git(repo, "remote", "get-url", "origin").removesuffix(".git") == links[folder + "Repository"].rstrip("/"), "Repository link does not match " + folder)
        tracked = subprocess.check_output(["git", "-C", str(repo), "ls-files", "-z"]).decode().split("\0")
        if repo.resolve() != (ROOT / folder).resolve():
            current_names = set(filter(None, git(ROOT / folder, "ls-files").splitlines()))
            require(current_names == set(filter(None, tracked)), "Synchronise the complete " + folder + " file list before packaging.")
        for name in filter(None, tracked):
            if repo.resolve() != (ROOT / folder).resolve():
                current = ROOT / folder / name
                require(current.is_file() and not current.is_symlink() and current.read_bytes() == (repo / name).read_bytes(), "Synchronise the deployment and coursework source: " + folder + "/" + name)
            add(repo / name, folder + "/" + name)
        provenance[folder] = {"repository": links[folder + "Repository"], "commit": git(repo, "rev-parse", "HEAD"), "genuineHistoryCommits": count}

    manifest_path = ROOT / "exports" / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    require(manifest.get("source") == "MongoDB Atlas", "Actual Atlas export metadata is required.")
    require({"lesson", "order", "teacher"}.issubset({item["name"] for item in manifest["collections"]}), "Export lessons, orders and teachers.")
    for item in manifest["collections"]:
        require(item["name"] not in ["adminSession", "adminLoginAttempt"] and not item["name"].startswith("system."), "Never package operational authentication data.")
        name = item["file"]
        require(Path(name).name == name, "Invalid export filename.")
        path = ROOT / "exports" / name
        require(hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], "Export checksum mismatch: " + name)
        require(len(json.loads(path.read_bytes())) == item["count"], "Export count mismatch: " + name)
        add(path, "exports/" + name)
    add(manifest_path, "exports/manifest.json")
    for name in ["README.md", "AI_ACKNOWLEDGEMENT.md", "VERIFICATION.md", "DEMO_GUIDE.md", "SUBMISSION_GUIDE.md", "STUDENT_HANDOVER.md", "submission-links.json"]:
        add(ROOT / name, name)
    # Only committed evidence is eligible; exports above remain local/private.
    for name in filter(None, git(ROOT, "ls-files", "verification").splitlines()):
        add(ROOT / name, name)
    collection_path = ROOT / "backend/postman/AfterClass.postman_collection.json"
    collection = json.loads(collection_path.read_text())
    for variable in collection.get("variable", []):
        if any(word in variable.get("key", "").lower() for word in ["token", "password", "secret"]):
            require(not variable.get("value"), "Never package populated Postman credentials.")
    for group in collection.get("item", []):
        for item in group.get("item", []):
            request = item.get("request", {})
            if request.get("url", "").endswith("/admin/session") and request.get("method") == "POST":
                require(json.loads(request["body"]["raw"]).get("password") == "{{adminPassword}}", "Keep the Postman password as a private placeholder.")
    add(collection_path, "AfterClass.postman_collection.json")
    for mode in ["atlas-test", "hosted-read-only"]:
        reports = sorted((ROOT / "verification").glob("postman-" + mode + "-*.json"))
        require(reports, "Run the actual Postman checks: " + mode)
        report = json.loads(reports[-1].read_text())
        require(report["requests"]["total"] == report["expectedRequests"] and not report["failures"] and not report["assertions"]["failed"] and not report["requests"]["failed"], "Postman checks failed: " + mode)
    # Reject actual URI credentials, keys and hashes even if accidentally tracked.
    import re
    forbidden = re.compile(rb"mongodb(?:\+srv)?://[^\s/@:]+:[^\s/@]+@|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|scrypt-v1:[a-f0-9]{32}:[a-f0-9]{128}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}")
    for name, contents in files.items():
        require(not forbidden.search(contents), "Credential pattern detected in " + name)
    package_manifest = {"studentNumber": number, "repositories": provenance, "deploymentRepository": links.get("deploymentRepository"), "files": {name: hashlib.sha256(contents).hexdigest() for name, contents in sorted(files.items())}}
    files["PACKAGE_MANIFEST.json"] = (json.dumps(package_manifest, indent=2) + "\n").encode()
    output = ROOT / "output"
    output.mkdir(exist_ok=True)
    target = output / "AfterClass-submission.zip"
    temporary = output / "AfterClass-submission.zip.tmp"
    with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, contents in sorted(files.items()):
            archive.writestr(name, contents)
    require(temporary.stat().st_size < 10_000_000, "The ZIP exceeds 10MB.")
    with zipfile.ZipFile(temporary) as archive:
        require(archive.testzip() is None, "ZIP integrity check failed.")
        require(len(archive.namelist()) == len(set(archive.namelist())), "Duplicate ZIP entries.")
        for name, contents in files.items():
            require(archive.read(name) == contents, "Archive content mismatch: " + name)
    temporary.replace(target)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    (output / "AfterClass-submission.zip.sha256").write_text(digest + "  AfterClass-submission.zip\n")
    print("Submission ZIP created and checked:", target, target.stat().st_size, "bytes;", len(files), "files")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit("Submission not packaged: " + str(error))
