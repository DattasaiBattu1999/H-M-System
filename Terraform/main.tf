provider "aws" {
  region = "ap-southeast-1"
}

# Module for Networking
module "network" {
  source = "./VPC"
}

# Module for Kubernetes Cluster
module "kubernetes" {
  source     = "./EKS"
  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.public_subnets
}