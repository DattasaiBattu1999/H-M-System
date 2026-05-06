# 1. Generate a secure private key
resource "tls_private_key" "hms_tls_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Create the AWS Key Pair using the generated public key
resource "aws_key_pair" "hms_key" {
  key_name   = "HM-System_key"
  public_key = tls_private_key.hms_tls_key.public_key_openssh
}

# 3. Save the private key to your local machine (Optional but recommended)
resource "local_file" "hms_private_key_file" {
  content         = tls_private_key.hms_tls_key.private_key_pem
  filename        = "HM-System_key.pem"
  file_permission = "0400" # Sets read-only permission for the owner (standard for SSH keys)
}