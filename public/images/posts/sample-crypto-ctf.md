---
title: "Crypto CTF 2024 Writeup"
date: 2024-02-20T10:00:00Z
draft: false
categories: ["Crypto", "CTF"]
tags: ["Cryptography", "Security", "CTF", "Writeup"]
description: "Solutions for Crypto CTF 2024 challenges"
image: "/images/crypto-ctf.jpg"
---

## Challenge Overview

This year's Crypto CTF featured some interesting cryptographic puzzles that tested our understanding of various encryption schemes.

### RSA Challenge
The first challenge involved breaking a weak RSA implementation where the primes were too close together.

```python
def solve_rsa():
    n = 1234567890...
    e = 65537
    # Solution code here
```

### Elliptic Curve Mystery
Another fascinating challenge involved elliptic curve cryptography with a twist.