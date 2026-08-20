---
title: Tensor 基础操作
description: 系列第 2 篇：Tensor 创建、形状变换、与 NumPy 互转及 GPU 加速。
date: 2026-06-09
tags: [PyTorch, Tensor]
category: note
type: note
series: pytorch-notes
seriesOrder: 2
---

本文是「PyTorch 学习笔记」系列第 2 篇。

## 创建 Tensor

```python
import torch

x = torch.rand(2, 3)      # 均匀分布
y = torch.zeros(3, 4)     # 全零
z = torch.tensor([[1, 2], [3, 4]])
```

## 形状变换

```python
z.view(1, 4)   # 重排
z.reshape(4, 1)
z.unsqueeze(0)  # 增维
```

## 与 NumPy 互转

```python
import numpy as np

a = z.numpy()          # tensor → numpy（共享内存）
b = torch.from_numpy(a)  # numpy → tensor
```
