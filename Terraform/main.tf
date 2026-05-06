provider "aws" {
  region = "ap-southeast-1"
}

module "vpc" {
  source          = "./VPC"
  vpc_cidr        = "10.0.0.0/16"
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.3.0/25", "10.0.3.128/25"]
}

module "eks" {
  source = "./EKS"
  vpc_id = module.vpc.vpc_id
  # Bridge the modules: Pass VPC outputs to EKS variables
  subnet_ids = module.vpc.private_subnet_ids
}

terraform {
  backend "s3" {
    bucket         = "hm-system-terraform-state"
    key            = "eks/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}