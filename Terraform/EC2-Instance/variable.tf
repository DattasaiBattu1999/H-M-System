variable "iname" {
  description = "Instance name"
  type        = list(string)
  default     = ["HMS-Instance1", "HMS-Instance2"]
}

variable "env" {
  type    = list(string)
  default = ["Qa", "Prod"]
}

variable "app" {
  type = list(string)
  # FIXED: Added missing closing quote after H-M-System2
  default = ["H-M-System1", "H-M-System2"]
}

variable "ami" {
  type    = list(string)
  default = ["ami-0be9cb9f67c8dabd6", "ami-0be9cb9f67c8dabd6"]
}

variable "instance_type" {
  type    = list(string)
  default = ["t3.small", "t3.micro"]
}

# Ensure this name matches exactly what you use in resource.tf
variable "available_zone" {
  type    = list(string)
  default = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "EBS_volume" {
  type    = list(number)
  default = [15, 10]
}