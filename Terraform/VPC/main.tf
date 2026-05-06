# Fetch all available Availability Zones in the current region
data "aws_availability_zones" "available" {}

resource "aws_vpc" "hms_vpc" {
  cidr_block = var.vpc_cidr
  tags       = { Name = "hm-system-vpc" }
}

resource "aws_internet_gateway" "hms-igw" {
  vpc_id = aws_vpc.hms_vpc.id
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.hms_vpc.id
  cidr_block              = var.public_subnets[count.index]
  map_public_ip_on_launch = true

  # Cycle through available AZs (e.g., 0 -> ap-southeast-1a, 1 -> ap-southeast-1b)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "public-subnet-${count.index}" }
}

resource "aws_subnet" "private" {
  count      = length(var.private_subnets)
  vpc_id     = aws_vpc.hms_vpc.id
  cidr_block = var.private_subnets[count.index]

  # Ensure private subnets are also spread across AZs
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "private-subnet-${count.index}" }
}

# Routing for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.hms_vpc.id
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.hms-igw.id
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway logic for Private Subnets
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id # Place NAT in the first public subnet
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.hms_vpc.id
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}