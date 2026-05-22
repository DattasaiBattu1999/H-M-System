terraform {
  backend "s3" {
    bucket         = "aws-hm-system-bucket"              
    key            = "hm-system/core-infra/terraform.tfstate" 
    region         = "ap-southeast-1"                       
    dynamodb_table = "terraform-lock-table"
  }
}