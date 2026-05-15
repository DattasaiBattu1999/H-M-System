variable "region" {
  description = "AWS Region"
  default     = "ap-southeast-1"
}

variable "cluster_name" {
  description = "EKS Cluster Name"
  default     = "hm-eks-cluster"
}

variable "eks_version" {
  description = "EKS Kubernetes Version"
  default     = "1.30"
}

variable "private_subnet_ids" {
  description = "Private Subnet IDs"
  type        = list(string)
}

variable "node_desired_size" {
  default = 2
}

variable "node_max_size" {
  default = 3
}

variable "node_min_size" {
  default = 1
}

variable "instance_types" {
  type = list(string)

  default = [
    "t3.medium"
  ]
}