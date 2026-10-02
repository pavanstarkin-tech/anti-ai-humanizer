import paramiko
import os

def deploy_php():
    host = "193.203.185.110"
    port = 65002
    user = "u833088220"
    password = "Sanvith@27"

    remote_base = "/home/u833088220/domains/acheva.in/public_html/humanizer-api"
    local_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "php_backend"))

    print(f"Deploying PHP backend to {host}:{port} -> {remote_base}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password, timeout=15)

    sftp = client.open_sftp()

    def ensure_remote_dir(path):
        parts = path.split("/")
        curr = ""
        for p in parts:
            if not p:
                continue
            curr += "/" + p
            try:
                sftp.stat(curr)
            except IOError:
                try:
                    sftp.mkdir(curr)
                    print(f"Created remote directory: {curr}")
                except Exception as e:
                    pass

    ensure_remote_dir(remote_base)
    ensure_remote_dir(f"{remote_base}/api")
    ensure_remote_dir(f"{remote_base}/storage")
    ensure_remote_dir(f"{remote_base}/storage/uploads")
    ensure_remote_dir(f"{remote_base}/storage/output")

    # Upload all files
    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        remote_curr = remote_base if rel_path == "." else f"{remote_base}/{rel_path.replace(os.sep, '/')}"
        ensure_remote_dir(remote_curr)

        for file in files:
            local_file = os.path.join(root, file)
            remote_file = f"{remote_curr}/{file}"
            print(f"Uploading: {file} -> {remote_file}")
            sftp.put(local_file, remote_file)

    sftp.close()

    # Set permissions
    client.exec_command(f"chmod -R 755 {remote_base}")
    client.exec_command(f"chmod -R 777 {remote_base}/storage")

    print("\nDeployment complete! Verifying health endpoint...")
    stdin, stdout, stderr = client.exec_command(f"php {remote_base}/api/health.php")
    print(stdout.read().decode().strip())

    client.close()

if __name__ == "__main__":
    deploy_php()
