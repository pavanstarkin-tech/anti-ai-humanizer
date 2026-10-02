import paramiko
import os
import sys

def check_ssh():
    host = os.environ.get("SSH_HOST", "193.203.185.110")
    port = int(os.environ.get("SSH_PORT", "65002"))
    user = os.environ.get("SSH_USER", "u833088220")
    password = os.environ.get("SSH_PASS", "Sanvith@27")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password, timeout=10)
    print("Connected successfully!")
    client.close()

if __name__ == "__main__":
    check_ssh()
