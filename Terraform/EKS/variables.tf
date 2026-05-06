variable "region" {
  default = "ap-southeast-1"
}

variable "vpc_id" {}

# This variable receives the actual subnet-xxxxx IDs
variable "subnet_ids" {
  type = list(string)
}