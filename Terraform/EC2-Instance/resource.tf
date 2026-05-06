resource "aws_instance" "HMS-aws_instance" {
  count = 1

  tags = {
    Name = var.iname[count.index]
    env  = var.env[count.index]
    app  = var.app[count.index]
  }

  ami           = var.ami[count.index]
  instance_type = var.instance_type[count.index]

  key_name = aws_key_pair.hms_key.key_name

  vpc_security_group_ids = [aws_security_group.My-Sg.id]

  availability_zone = var.available_zone[count.index]

  root_block_device {
    volume_size = var.EBS_volume[count.index]
  }

  provisioner "remote-exec" {
    inline = [
      "sudo yum update -y",
      "sudo yum install -y nginx",
      "sudo systemctl start nginx"
    ]
  }

  connection {
    type        = "ssh"
    user        = "ec2-user"
    private_key = file("C:/Users/datta/OneDrive/Documents/DevOps.pem")
    host        = self.public_ip
  }
}