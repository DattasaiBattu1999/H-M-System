# --------------------------------
# VPC
# --------------------------------

resource "aws_vpc" "hms_vpc" {

  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = var.vpc_name
  }
}

# --------------------------------
# Internet Gateway
# --------------------------------

resource "aws_internet_gateway" "internet_gateway" {

  vpc_id = aws_vpc.hms_vpc.id

  tags = {
    Name = var.internet_gateway_name
  }
}

# --------------------------------
# Availability Zones
# --------------------------------

data "aws_availability_zones" "available" {}

# --------------------------------
# Public Subnets
# --------------------------------

resource "aws_subnet" "public_subnet" {

  count = length(var.public_subnets)

  vpc_id = aws_vpc.hms_vpc.id

  cidr_block = var.public_subnets[count.index]

  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}"

    "kubernetes.io/role/elb" = "1"
  }
}

# --------------------------------
# Private Subnets
# --------------------------------

resource "aws_subnet" "private_subnet" {

  count = length(var.private_subnets)

  vpc_id = aws_vpc.hms_vpc.id

  cidr_block = var.private_subnets[count.index]

  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}"

    "kubernetes.io/role/internal-elb" = "1"
  }
}

# --------------------------------
# Public Route Table
# --------------------------------

resource "aws_route_table" "public_route_table" {

  vpc_id = aws_vpc.hms_vpc.id

  route {
    cidr_block = "0.0.0.0/0"

    gateway_id = aws_internet_gateway.internet_gateway.id
  }

  tags = {
    Name = var.public_route_table_name
  }
}

# --------------------------------
# Public Route Table Association
# --------------------------------

resource "aws_route_table_association" "public_assoc" {

  count = length(var.public_subnets)

  subnet_id = aws_subnet.public_subnet[count.index].id

  route_table_id = aws_route_table.public_route_table.id
}

# --------------------------------
# Elastic IP for NAT Gateway
# --------------------------------

resource "aws_eip" "nat_eip" {

  domain = "vpc"

  tags = {
    Name = "nat-eip"
  }
}

# --------------------------------
# NAT Gateway
# --------------------------------

resource "aws_nat_gateway" "hms_nat_gateway" {

  allocation_id = aws_eip.nat_eip.id

  subnet_id = aws_subnet.public_subnet[0].id

  tags = {
    Name = "hms-nat-gateway"
  }

  depends_on = [
    aws_internet_gateway.internet_gateway
  ]
}

# --------------------------------
# Private Route Table
# --------------------------------

resource "aws_route_table" "private_route_table" {

  vpc_id = aws_vpc.hms_vpc.id

  route {
    cidr_block = "0.0.0.0/0"

    nat_gateway_id = aws_nat_gateway.hms_nat_gateway.id
  }

  tags = {
    Name = var.private_route_table_name
  }
}

# --------------------------------
# Private Route Table Association
# --------------------------------

resource "aws_route_table_association" "private_assoc" {

  count = length(var.private_subnets)

  subnet_id = aws_subnet.private_subnet[count.index].id

  route_table_id = aws_route_table.private_route_table.id
}