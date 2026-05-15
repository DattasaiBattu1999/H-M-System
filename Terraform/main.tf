# Root Terraform/main.tf

module "network" {
  source = "./VPC"
}

module "kubernetes" {
  source = "./EKS"
  
  # Map the output "private_subnet_ids" from VPC to the EKS module
  private_subnet_ids = module.network.private_subnet_ids
  
  # If your EKS module needs the VPC ID, make sure it is defined 
  # in EKS/variables.tf first, otherwise remove this line.
  # vpc_id = module.network.vpc_id 
}