import paramiko

def link_humanizer_folder():
    host = "193.203.185.110"
    port = 65002
    user = "u833088220"
    password = "Sanvith@27"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password, timeout=15)

    remote_humanizer = "/home/u833088220/domains/acheva.in/public_html/humanizer"
    remote_api = "/home/u833088220/domains/acheva.in/public_html/humanizer-api"

    commands = [
        f"mkdir -p {remote_humanizer}",
        f"cp -r {remote_api}/* {remote_humanizer}/",
        f"chmod -R 755 {remote_humanizer}",
        f"chmod -R 777 {remote_humanizer}/storage"
    ]

    for cmd in commands:
        client.exec_command(cmd)

    print("Humanizer web folder mirrored to https://acheva.in/humanizer/")
    client.close()

if __name__ == "__main__":
    link_humanizer_folder()
