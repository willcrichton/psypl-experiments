def invert_dictionary(obj):
  """
  Returns a dictionary of values mapped to lists of keys
  """

  inv_obj = {}
  for key, value in obj.items():
    inv_obj.setdefault(value, list()).append(key)
  return inv_obj
