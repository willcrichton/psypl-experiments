# {"skip": true}
def count(arr):
  """
  Count the frequency of elements in an array
  """

  key = {}
  for el in arr:
    key[el] = 1 if el not in key else key[el] + 1
  return key
