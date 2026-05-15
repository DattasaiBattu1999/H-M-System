output "cluster_name" {
  value = module.kubernetes.aws_eks_cluster.eks_cluster.name
}

output "cluster_endpoint" {
  value = module.kubernetes.aws_eks_cluster.eks_cluster.endpoint
}

output "node_group_name" {
  value = module.kubernetes.aws_eks_node_group.eks_nodes.node_group_name
}