# ======================================
# EKS Cluster IAM Role
# ======================================

resource "aws_iam_role" "eks_role" {

  name = "eks-cluster-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "eks.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ======================================
# Attach EKS Cluster Policy
# ======================================

resource "aws_iam_role_policy_attachment" "eks_policy" {

  role = aws_iam_role.eks_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ======================================
# EKS Cluster
# ======================================

resource "aws_eks_cluster" "eks_cluster" {

  name = var.cluster_name

  role_arn = aws_iam_role.eks_role.arn

  version = var.eks_version

  vpc_config {

    subnet_ids = var.private_subnet_ids

    endpoint_private_access = true

    endpoint_public_access = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_policy
  ]

  tags = {
    Name = var.cluster_name
  }
}

# ======================================
# Node IAM Role
# ======================================

resource "aws_iam_role" "node_role" {

  name = "eks-node-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ======================================
# Worker Node Policy
# ======================================

resource "aws_iam_role_policy_attachment" "worker_node_policy" {

  role = aws_iam_role.node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

# ======================================
# CNI Policy
# ======================================

resource "aws_iam_role_policy_attachment" "cni_policy" {

  role = aws_iam_role.node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

# ======================================
# ECR ReadOnly Policy
# ======================================

resource "aws_iam_role_policy_attachment" "ecr_policy" {

  role = aws_iam_role.node_role.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# ======================================
# EKS Node Group
# ======================================

resource "aws_eks_node_group" "eks_nodes" {

  cluster_name = aws_eks_cluster.eks_cluster.name

  node_group_name = "hm-eks-node-group"

  node_role_arn = aws_iam_role.node_role.arn

  subnet_ids = var.private_subnet_ids

  instance_types = var.instance_types

  capacity_type = "ON_DEMAND"

  scaling_config {

    desired_size = var.node_desired_size

    max_size = var.node_max_size

    min_size = var.node_min_size
  }

  depends_on = [

    aws_iam_role_policy_attachment.worker_node_policy,

    aws_iam_role_policy_attachment.cni_policy,

    aws_iam_role_policy_attachment.ecr_policy
  ]

  tags = {
    Name = "hm-eks-node-group"
  }
}