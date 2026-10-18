# PyTorch — Complete Guide
### Deep Learning in Python | Tensors → Autograd → Models → Training → Inference

---

## TABLE OF CONTENTS
1. [What PyTorch Is & Why It Exists](#1-what-pytorch-is--why-it-exists)
2. [Installation & Tensors](#2-installation--tensors)
3. [Tensor Operations & Broadcasting](#3-tensor-operations--broadcasting)
4. [Autograd — Automatic Differentiation](#4-autograd--automatic-differentiation)
5. [Building Models with nn.Module](#5-building-models-with-nnmodule)
6. [Loss Functions & Optimizers](#6-loss-functions--optimizers)
7. [The Training Loop](#7-the-training-loop)
8. [Datasets & DataLoaders](#8-datasets--dataloaders)
9. [GPU Acceleration & Devices](#9-gpu-acceleration--devices)
10. [Saving, Loading & Inference](#10-saving-loading--inference)
11. [End-to-End Example](#11-end-to-end-example)
12. [Interview Q&A](#12-interview-qa)

---

## 1. What PyTorch Is & Why It Exists

**Theory.** PyTorch is a deep-learning framework built around two ideas that make training neural networks practical. The first is the **tensor** — an n-dimensional array (like a NumPy array) that can also live on a GPU, where thousands of arithmetic operations run in parallel. Neural networks are, at their core, enormous chains of matrix multiplications, and GPUs make those fast; tensors are the data type that flows through the entire system. The second idea is **autograd (automatic differentiation)**. Training a network means adjusting millions of parameters to reduce an error signal, and doing that requires the *gradient* — how much each parameter contributed to the error. Computing those derivatives by hand is impossible at scale, so PyTorch records every operation you perform into a **dynamic computation graph** and, on command, walks it backward to compute all gradients automatically (backpropagation). "Dynamic" means the graph is built on the fly as your Python code runs, so you can use normal loops and conditionals and debug with a regular debugger — the flexibility that made PyTorch the dominant framework in research and, increasingly, production.

```
The four pillars, and how they connect:

  Tensor        →  the data (inputs, weights, outputs); runs on CPU or GPU
  Autograd      →  records operations, computes gradients via .backward()
  nn.Module     →  organizes layers/parameters into a model
  Optimizer     →  uses gradients to update the parameters (learning)

  Training = repeat:  forward pass → compute loss → backward pass → optimizer step
```

---

## 2. Installation & Tensors

**Theory.** Install the build that matches your hardware — a CPU-only wheel, or a CUDA build if you have an NVIDIA GPU (the official selector on pytorch.org gives the exact command). A **tensor** is the fundamental object: think of it as a typed, multi-dimensional array with a **shape** (its dimensions), a **dtype** (float32 by default for model math), and a **device** (where it lives — CPU or GPU). You create tensors from Python lists or NumPy arrays, or with factory functions (`zeros`, `ones`, `randn`), and they share NumPy's ergonomics for indexing and slicing. Getting comfortable reading and manipulating tensor *shapes* is the single most important practical skill, because most bugs in deep learning are shape mismatches.

```python
# CPU-only install (see pytorch.org for the exact CUDA command)
pip install torch torchvision

import torch

# Create tensors
a = torch.tensor([[1.0, 2.0], [3.0, 4.0]])   # from a Python list
z = torch.zeros(2, 3)                          # 2x3 of zeros
o = torch.ones(2, 3)
r = torch.randn(2, 3)                          # random from normal distribution

print(a.shape)     # torch.Size([2, 2]) — dimensions
print(a.dtype)     # torch.float32 — element type
print(a.device)    # cpu — where it lives

# Interop with NumPy (shares memory on CPU)
import numpy as np
t = torch.from_numpy(np.array([1, 2, 3]))
back = t.numpy()
```

---

## 3. Tensor Operations & Broadcasting

**Theory.** Almost all neural-network computation reduces to a handful of tensor operations: element-wise math (`+`, `*`), **matrix multiplication** (`@` or `torch.matmul`), and **reshaping** (`view`, `reshape`, `unsqueeze`, `squeeze`) to line up dimensions. Two concepts do heavy lifting. **Broadcasting** lets operations work on tensors of different shapes by automatically stretching the smaller one along size-1 dimensions — so you can add a bias vector to a whole batch without writing a loop. **Reduction** operations (`sum`, `mean`, `max`) collapse a dimension, controlled by the `dim` argument, which is how you aggregate across a batch or across features. Knowing which dimension is the batch dimension (conventionally the first, `dim=0`) and which is features is essential to keeping shapes correct.

```python
import torch

x = torch.randn(3, 4)      # 3 samples, 4 features each
w = torch.randn(4, 2)      # weight matrix: 4 in -> 2 out
b = torch.randn(2)         # bias for the 2 outputs

# Matrix multiply: (3x4) @ (4x2) = (3x2)
out = x @ w + b            # b (shape [2]) is BROADCAST across all 3 rows
print(out.shape)           # torch.Size([3, 2])

# Reshaping
t = torch.arange(12)       # 1D: [0..11]
t = t.view(3, 4)           # reshape to 3x4 (no copy)
t = t.unsqueeze(0)         # add a dimension -> shape [1, 3, 4]
t = t.squeeze(0)           # remove size-1 dimension -> [3, 4]

# Reductions along a dimension
m = torch.randn(3, 4)
print(m.sum(dim=0).shape)  # sum over rows -> shape [4]
print(m.mean(dim=1).shape) # mean over columns -> shape [3]
```

---

## 4. Autograd — Automatic Differentiation

**Theory.** This is the mechanism that lets networks learn. When you create a tensor with `requires_grad=True`, PyTorch starts **recording** every operation applied to it into a computation graph. When you later call `.backward()` on a scalar (usually the loss), PyTorch traverses that graph in reverse, applying the chain rule to compute the gradient of the loss with respect to every tracked tensor, and stores each result in that tensor's `.grad` attribute. Those gradients are exactly what the optimizer uses to nudge parameters in the direction that reduces the loss. Two operational details matter: gradients **accumulate** by default (they add to `.grad` on each backward), so you must call `optimizer.zero_grad()` each iteration to clear them; and during pure inference you wrap code in `torch.no_grad()` to skip graph-building, which saves memory and time because you don't need gradients when you're not training.

```python
import torch

# Track gradients on a parameter
w = torch.tensor([2.0], requires_grad=True)
x = torch.tensor([3.0])

# Forward pass — operations are recorded
y = w * x + 1          # y = 2*3 + 1 = 7
loss = (y - 10) ** 2   # some error to minimize

# Backward pass — compute d(loss)/d(w) automatically
loss.backward()
print(w.grad)          # gradient of loss w.r.t. w

# Gradients accumulate — clear them before the next step
w.grad.zero_()

# Disable gradient tracking for inference (faster, less memory)
with torch.no_grad():
    prediction = w * x + 1
```

---

## 5. Building Models with nn.Module

**Theory.** Real networks aren't loose tensors — they're organized into **layers** with learnable parameters, and `nn.Module` is the base class that structures them. You subclass it, declare your layers in `__init__` (each layer, like `nn.Linear`, owns its own weight and bias tensors with `requires_grad=True`), and define the **`forward`** method describing how input flows through those layers to produce output. PyTorch automatically registers every layer's parameters so `model.parameters()` returns them all for the optimizer, and `model.to(device)` moves the whole network to the GPU in one call. **Activation functions** (ReLU, sigmoid) between linear layers introduce non-linearity — without them a stack of linear layers would collapse into a single linear function and couldn't learn complex patterns. You never call `forward` directly; you call the model instance (`model(x)`), which runs some bookkeeping and then your `forward`.

```python
import torch
import torch.nn as nn

class Net(nn.Module):
    def __init__(self, in_features, hidden, num_classes):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden)   # learnable weight + bias
        self.relu = nn.ReLU()                        # non-linearity
        self.fc2 = nn.Linear(hidden, num_classes)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x                                     # raw scores (logits)

model = Net(in_features=20, hidden=64, num_classes=3)
print(model)                                         # prints the layer structure

# All learnable parameters (fed to the optimizer)
total = sum(p.numel() for p in model.parameters())
print(f"{total} trainable parameters")

# Sequential — a shortcut for simple stacks
seq = nn.Sequential(
    nn.Linear(20, 64), nn.ReLU(), nn.Linear(64, 3)
)
```

---

## 6. Loss Functions & Optimizers

**Theory.** Two components turn a model into a *learning* system. The **loss function** measures how wrong the model's predictions are compared to the true labels, producing a single number to minimize — you pick it to match the task: `CrossEntropyLoss` for multi-class classification (it expects raw logits and applies softmax internally), `BCEWithLogitsLoss` for binary, and `MSELoss` for regression. The **optimizer** is the algorithm that updates the parameters using the gradients autograd computed. **SGD** (stochastic gradient descent) is the classic; **Adam** is the popular default because it adapts the step size per parameter and usually converges faster with less tuning. The **learning rate** is the most important hyperparameter — it scales how big each update step is: too high and training diverges, too low and it crawls. A learning-rate **scheduler** can lower it over time for finer convergence.

```python
import torch.nn as nn
import torch.optim as optim

# Loss — choose by task
criterion = nn.CrossEntropyLoss()      # multi-class classification (expects logits)
# criterion = nn.MSELoss()             # regression
# criterion = nn.BCEWithLogitsLoss()   # binary classification

# Optimizer — updates model.parameters() using their .grad
optimizer = optim.Adam(model.parameters(), lr=1e-3)
# optimizer = optim.SGD(model.parameters(), lr=0.01, momentum=0.9)

# Optional: decay the learning rate over epochs
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.1)
```

---

## 7. The Training Loop

**Theory.** PyTorch is explicit — you write the training loop yourself, which demystifies exactly how learning happens. Every iteration performs the same five steps: **(1) zero the gradients** (`optimizer.zero_grad()`) so last step's gradients don't accumulate; **(2) forward pass** — run inputs through the model to get predictions; **(3) compute the loss** against the true labels; **(4) backward pass** (`loss.backward()`) — autograd fills every parameter's `.grad`; **(5) optimizer step** (`optimizer.step()`) — apply those gradients to update the parameters. One full pass over the dataset is an **epoch**, and you repeat for many epochs. Two mode switches matter: `model.train()` enables training-only behavior (dropout, batchnorm updates) and `model.eval()` disables them for validation/inference. You also validate on held-out data each epoch (under `torch.no_grad()`) to detect **overfitting** — when training loss keeps dropping but validation loss rises.

```python
import torch

for epoch in range(num_epochs):
    model.train()                          # training mode
    running_loss = 0.0
    for inputs, labels in train_loader:    # batches from a DataLoader (section 8)
        optimizer.zero_grad()              # 1. clear old gradients
        outputs = model(inputs)            # 2. forward pass
        loss = criterion(outputs, labels)  # 3. compute loss
        loss.backward()                    # 4. backprop -> fills .grad
        optimizer.step()                   # 5. update parameters
        running_loss += loss.item()

    # Validation — no gradients, eval mode
    model.eval()
    correct = 0
    with torch.no_grad():
        for inputs, labels in val_loader:
            preds = model(inputs).argmax(dim=1)   # class with highest score
            correct += (preds == labels).sum().item()

    print(f"Epoch {epoch+1}: loss={running_loss/len(train_loader):.4f}, "
          f"val_acc={correct/len(val_loader.dataset):.3f}")
```

---

## 8. Datasets & DataLoaders

**Theory.** Feeding data efficiently is as important as the model. PyTorch splits this into two pieces. A **`Dataset`** knows how to fetch *one* sample: you implement `__len__` (how many samples) and `__getitem__` (return the i-th input/label pair) — this is where you load an image, tokenize text, or read a row. A **`DataLoader`** wraps a Dataset and handles the mechanics of feeding a training loop: it groups samples into **batches** (you rarely train on one sample at a time — batches make GPU math efficient and gradients more stable), **shuffles** the data each epoch so the model doesn't learn order, and can load batches **in parallel** with worker processes so the GPU never waits for data. The batch size is a key knob: larger batches use more memory but give smoother gradient estimates.

```python
import torch
from torch.utils.data import Dataset, DataLoader

class MyDataset(Dataset):
    def __init__(self, features, labels):
        self.X = torch.tensor(features, dtype=torch.float32)
        self.y = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.X)                 # total number of samples

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]    # one (input, label) pair

dataset = MyDataset(X_train, y_train)
train_loader = DataLoader(
    dataset,
    batch_size=32,       # samples per batch
    shuffle=True,        # reshuffle every epoch
    num_workers=4,       # parallel data-loading processes
)

# Iterating yields batches: inputs shape [32, features], labels shape [32]
for inputs, labels in train_loader:
    ...
```

---

## 9. GPU Acceleration & Devices

**Theory.** The GPU is what makes deep learning fast, but PyTorch never moves data there automatically — you do it explicitly, and the golden rule is that **every tensor in an operation must be on the same device**. The idiomatic pattern is to detect the best available device once, move the model to it, and move each batch to it inside the loop. Mismatched devices are one of the most common runtime errors. Beyond simply using the GPU, **mixed precision** (`torch.cuda.amp`) runs parts of the math in 16-bit floats to roughly double throughput and halve memory with minimal accuracy loss — standard practice for large models. For multiple GPUs, `DistributedDataParallel` replicates the model across devices and synchronizes gradients.

```python
import torch

# Pick the best device once (CUDA GPU, Apple Metal, or CPU)
device = (
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)

model = model.to(device)               # move the whole network

for inputs, labels in train_loader:
    inputs = inputs.to(device)         # move each batch to the same device
    labels = labels.to(device)
    outputs = model(inputs)            # all tensors now on `device`
    ...

# Mixed precision for speed/memory (CUDA)
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()
with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, labels)
scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

---

## 10. Saving, Loading & Inference

**Theory.** Once trained, you persist the model so you can serve it later without retraining. The recommended approach saves the **`state_dict`** — a plain dictionary of all learnable parameters — rather than pickling the whole model object, because it's portable and version-robust: you recreate the model class in code and load the weights into it. For **inference** (making predictions in production), three things are non-negotiable: call `model.eval()` to switch off training-only layers like dropout, wrap the forward pass in `torch.no_grad()` to skip gradient tracking (faster, less memory), and remember to move inputs to the model's device. For deployment beyond a Python process, you can export with **TorchScript** or **ONNX** to run the model in a standalone runtime. This is exactly the model you would load once at startup and serve behind a FastAPI endpoint (see guide 08, section 16).

```python
import torch

# SAVE — just the parameters (recommended)
torch.save(model.state_dict(), "model.pt")

# LOAD — recreate the architecture, then load weights
model = Net(in_features=20, hidden=64, num_classes=3)
model.load_state_dict(torch.load("model.pt", map_location="cpu"))
model.eval()                              # inference mode!

# Predict on new data
def predict(sample):
    x = torch.tensor(sample, dtype=torch.float32).unsqueeze(0)  # add batch dim
    with torch.no_grad():                                        # no gradients
        logits = model(x)
        probs = torch.softmax(logits, dim=1)
        conf, cls = torch.max(probs, dim=1)
    return int(cls), float(conf)

# Checkpoint (to resume training): save more than just weights
torch.save({
    "epoch": epoch,
    "model_state": model.state_dict(),
    "optimizer_state": optimizer.state_dict(),
    "loss": loss,
}, "checkpoint.pt")
```

---

## 11. End-to-End Example

**Theory.** This ties every section together into the smallest complete program that actually learns: define a model (`nn.Module`), wrap data in a `DataLoader`, pick a loss and optimizer, run the five-step training loop for a few epochs, and save the result. Read it as the canonical skeleton you adapt for any supervised task — swap the dataset, the model architecture, and the loss to fit the problem, and the shape of the program stays the same.

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

# --- Synthetic data: 1000 samples, 20 features, 3 classes ---
X = torch.randn(1000, 20)
y = torch.randint(0, 3, (1000,))
loader = DataLoader(TensorDataset(X, y), batch_size=32, shuffle=True)

# --- Model ---
model = nn.Sequential(
    nn.Linear(20, 64), nn.ReLU(),
    nn.Linear(64, 32), nn.ReLU(),
    nn.Linear(32, 3),
)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

# --- Loss + optimizer ---
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

# --- Train ---
for epoch in range(10):
    model.train()
    total = 0.0
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = criterion(model(inputs), labels)
        loss.backward()
        optimizer.step()
        total += loss.item()
    print(f"epoch {epoch+1}: loss={total/len(loader):.4f}")

# --- Save for serving ---
torch.save(model.state_dict(), "model.pt")
```

---

## 12. Interview Q&A

**Q: What is a tensor, and how does it differ from a NumPy array?**
A: A tensor is an n-dimensional array and PyTorch's core data type. Unlike a NumPy array it can live on a GPU for parallel computation and it integrates with autograd to track operations for automatic gradient computation. On CPU it can even share memory with a NumPy array.

**Q: Explain autograd and backpropagation.**
A: When tensors have `requires_grad=True`, PyTorch records each operation into a dynamic computation graph. Calling `.backward()` on the scalar loss traverses the graph in reverse applying the chain rule, computing the gradient of the loss with respect to every parameter and storing it in `.grad`. The optimizer then uses those gradients to update the parameters.

**Q: Why do you call `optimizer.zero_grad()` every iteration?**
A: Gradients accumulate (add) into `.grad` on each `backward()` call. Without zeroing them first, you'd sum gradients across iterations and get incorrect updates. So each step: zero grads, forward, loss, backward, step.

**Q: What's the difference between `model.train()` and `model.eval()`?**
A: They toggle training-specific layer behavior. `train()` enables dropout and lets batch-norm update its running statistics; `eval()` disables dropout and uses fixed batch-norm stats. Always switch to `eval()` for validation/inference. It's separate from `torch.no_grad()`, which disables gradient tracking.

**Q: What does `torch.no_grad()` do and when do you use it?**
A: It disables autograd's operation recording, so no computation graph is built. Use it during inference and validation — you don't need gradients there, and skipping the graph saves memory and runs faster.

**Q: What are the five steps of a training loop?**
A: zero_grad (clear gradients), forward pass (predictions), compute loss, backward pass (compute gradients), optimizer.step (update parameters). Repeat over batches; one full pass over the data is an epoch.

**Q: Dataset vs DataLoader?**
A: A Dataset defines how to access one sample (`__len__`, `__getitem__`). A DataLoader wraps a Dataset to yield shuffled, parallel-loaded batches to the training loop. Batching makes GPU computation efficient and stabilizes gradient estimates.

**Q: SGD vs Adam, and what's the learning rate?**
A: Both are optimizers that update parameters from gradients. SGD takes a fixed step (optionally with momentum); Adam adapts the step size per parameter and usually converges faster with less tuning, making it a common default. The learning rate scales each update — too high diverges, too low is slow; it's the most important hyperparameter.

**Q: How do you save and serve a trained model?**
A: Save the `state_dict` (the parameters), then recreate the model class and `load_state_dict` into it. For serving: call `model.eval()`, run the forward pass under `torch.no_grad()`, move inputs to the model's device, and load the model once at startup (e.g., behind a FastAPI endpoint). For non-Python runtimes, export via TorchScript or ONNX.

**Q: What causes overfitting and how do you detect/reduce it?**
A: Overfitting is when the model memorizes training data and generalizes poorly — training loss drops while validation loss rises. Detect it by tracking validation metrics each epoch. Reduce it with more data, regularization (dropout, weight decay), early stopping, or a simpler model.
