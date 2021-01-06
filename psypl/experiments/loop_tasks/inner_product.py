TASK = {
    'prompt': 'This function should compute the inner product of two vectors, that is element-wise multiply the vectors and sum the result together. Both input vectors are assumed to be the same size.',
    'test': 'assert_eq!(innerproduct(vec![1, 2], vec![3, 4]), 11)',
    'header': 'fn innerproduct(v1: Vec<i32>, v2: Vec<i32>) -> i32 {',
    'footer': '}',
    'programs': [
        {
            'cond': 'fused',
            'correct': True,
            'program': '''
let mut c = 0;
for i in 0 .. v1.len() {
  c += v1[i] * v2[i];
}
return c;
            '''
        },
        {
            'cond': 'fused',
            'correct': False,
            'program': '''
let mut c = 0;
for i in 0 .. v1.len() {
  c += v1[i] * v1[i];
}
return c;
            '''
        },
        {
            'cond': Condition.LoopSeparate,
            'correct': True,
            'program': '''
let mut v3 = Vec::new();
for i in 0 .. v1.len() {
  v3.push(v1[i] * v2[i]);
}

let mut c = 0;
for i in 0 .. v3.len() {
  c += v3[i];
}

return c;
            '''
        },
        {
            'cond': Condition.LoopSeparate,
            'correct': False,
            'program': '''
let mut v3 = Vec::new();
for i in 0 .. v1.len() {
  v3.push(v1[i] * v1[i]);
}

let mut c = 0;
for i in 0 .. v3.len() {
  c += v3[i];
}

return c;
            '''
        },
        {
            'cond': Condition.HOF,
            'correct': True,
            'program': '''
v1.iter()
  .zip(v2.iter())
  .map(|(x, y)| x * y)
  .sum()
            '''
        },
        {
            'cond': Condition.HOF,
            'correct': False,
            'program': '''
v1.iter()
  .map(|x| x * x)
  .sum()
            '''
        }
    ]
}, 
