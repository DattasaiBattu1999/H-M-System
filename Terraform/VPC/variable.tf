variable "region" {
  description = "AWS Region"
  default     = "ap-southeast-1"
}

variable "vpc_name" {
  description = "VPC Name"
  default     = "HMSystem_VPC"
}

variable "vpc_cidr" {
  description = "VPC CIDR Block"
  default     = "10.0.0.0/22"
}

variable "internet_gateway_name" {
  description = "Internet Gateway Name"
  default     = "HMSystem_IGW"
}

variable "public_route_table_name" {
  description = "Public Route Table Name"
  default     = "HMSystem_Public_RT"
}

variable "private_route_table_name" {
  description = "Private Route Table Name"
  default     = "HMSystem_Private_RT"
}

variable "public_subnets" {
  description = "Public Subnet CIDRs"

  default = [
    "10.0.0.0/24",
    "10.0.1.0/24"
  ]
}

variable "private_subnets" {
  description = "Private Subnet CIDRs"

  default = [
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
}