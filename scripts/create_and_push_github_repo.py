import urllib.request
import json
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read token from environment or argument
TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_NAME = "anti-ai-humanizer"

def github_api_request(url, data=None, method="GET"):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8') if data else None,
        headers={
            "Authorization": f"token {TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Humanizer-Agent",
            "Content-Type": "application/json"
        },
        method=method
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            return json.loads(error_body)
        except:
            return {"error": error_body}

def main():
    global TOKEN
    if not TOKEN and len(sys.argv) > 1:
        TOKEN = sys.argv[1]

    if not TOKEN:
        print("Please provide GITHUB_TOKEN as environment variable or argument.")
        return

    print("==================================================================")
    print("🚀 GITHUB REPOSITORY CREATION & PUSH")
    print("==================================================================")

    # 1. Get authenticated user
    print("1. Fetching GitHub authenticated user...")
    user_data = github_api_request("https://api.github.com/user")
    username = user_data.get("login")
    if not username:
        print("❌ Failed to authenticate with provided GitHub Token.")
        print(user_data)
        return

    print(f"✅ Authenticated as: {username} ({user_data.get('name', '')})")

    # 2. Check if repo exists, or create it
    print(f"\n2. Creating repository '{REPO_NAME}' under '{username}'...")
    create_payload = {
        "name": REPO_NAME,
        "description": "Anti-AI Document Humanizer with In-Place Table & Layout Preservation and NVIDIA AI integration",
        "private": False,
        "auto_init": False
    }

    create_res = github_api_request("https://api.github.com/user/repos", data=create_payload, method="POST")
    
    html_url = create_res.get("html_url")
    clone_url = create_res.get("clone_url")

    if not html_url:
        print("ℹ️ Repository may already exist, fetching repository details...")
        repo_data = github_api_request(f"https://api.github.com/repos/{username}/{REPO_NAME}")
        html_url = repo_data.get("html_url")
        clone_url = repo_data.get("clone_url")

    print(f"✅ Repository URL: {html_url}")

    workspace_dir = "c:\\Users\\shese\\Desktop\\humaniser"
    os.chdir(workspace_dir)

    print("\n3. Adding files and committing...")
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", "Release: Anti-AI Humanizer with In-Place Table/Layout Preservation & PHP backend"], check=False)
    subprocess.run(["git", "branch", "-M", "main"], check=True)

    remote_url_with_token = f"https://{username}:{TOKEN}@github.com/{username}/{REPO_NAME}.git"
    
    subprocess.run(["git", "remote", "remove", "origin"], check=False)
    subprocess.run(["git", "remote", "add", "origin", remote_url_with_token], check=True)

    print(f"4. Pushing code to main branch...")
    push_res = subprocess.run(["git", "push", "-u", "origin", "main", "--force"], capture_output=True, text=True)
    
    if push_res.returncode == 0:
        print("✅ PUSH SUCCESSFUL!")
        print("==================================================================")
        print(f"🎉 Your GitHub Repository is Live:")
        print(f"👉 {html_url}")
        print("==================================================================")
    else:
        print("⚠️ Push output:")
        print(push_res.stdout)
        print(push_res.stderr)

if __name__ == "__main__":
    main()
