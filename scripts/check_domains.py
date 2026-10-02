import paramiko

def check_domains():
    host = "193.203.185.110"
    port = 65002
    user = "u833088220"
    password = "Sanvith@27"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password, timeout=10)

    commands = [
        "ls -la domains/acheva.in/public_html/",
        "ls -la domains/brown-kangaroo-967505.hostingersite.com/public_html/"
    ]

    for cmd in commands:
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode().strip())

    client.close()

if __name__ == "__main__":
    check_domains()
