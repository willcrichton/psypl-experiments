def frequencies(lst):
  f = {}
  for x in lst:
    f[x] = f[x] + 1 if x in f else 1
  return f
