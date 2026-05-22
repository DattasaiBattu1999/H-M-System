# Root Terraform/main.tf

# module "S3" {
#   source = "./S3"
# }

module "network" {
  source = "./VPC"
}

module "kubernetes" {
  source             = "./EKS"
  private_subnet_ids = module.network.private_subnet_ids
  vpc_id             = module.network.vpc_id
}