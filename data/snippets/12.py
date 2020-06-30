def collect_dictionary(obj):
  inv_obj = {}
  for key, value in obj.items():
    inv_obj.setdefault(value, list()).append(key)
  return inv_obj
