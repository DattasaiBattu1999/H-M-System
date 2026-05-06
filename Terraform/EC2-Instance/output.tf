output "instance_id" {
  description = "The ID of the server"
  value       = aws_instance.HMS-aws_instance[*].id
}

output "instance_public_ip" {
  description = "The public IP address of the server"
  value       = aws_instance.HMS-aws_instance[*].public_ip
}

output "instance_private_ip" {
  description = "The private IP address of the server"
  value       = aws_instance.HMS-aws_instance[*].private_ip
}

output "instance_volume_size" {
  description = "The volume size of the server"
  value       = aws_instance.HMS-aws_instance[*].root_block_device[0].volume_size
}

output "instance_arn" {
  description = "The ARN of the server"
  value       = aws_instance.HMS-aws_instance[*].arn
}

output "instance_public_dns" {
  description = "The public DNS name assigned to the server"
  value       = aws_instance.HMS-aws_instance[*].public_dns
}

output "instance_state" {
  description = "The state of the server"
  value       = aws_instance.HMS-aws_instance[*].instance_state
}

# ADD THIS to see your workspace name in the output!
output "workspace_name" {
  description = "The current terraform workspace"
  value       = terraform.workspace
}

