output "vpc_id" {
  value = aws_vpc.hms_vpc.id
}

output "public_subnet_ids" {
  value = aws_subnet.public_subnet[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private_subnet[*].id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.internet_gateway.id
}

output "nat_gateway_id" {
  value = aws_nat_gateway.hms_nat_gateway.id
}