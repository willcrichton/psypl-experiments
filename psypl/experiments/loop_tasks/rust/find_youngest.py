TASK = {
    'prompt': 'This function should take a vector of Person objects and return the youngest person older than 18.',
    'test': '''assert_eq!(
  find_youngest(&vec![
    Person{age: 17}, Person{age: 18}, Person{age: 19}, Person{age: 20}
  ]).age, 
  19)''',
    'header': '''
struct Person { age: i32 }
fn find_youngest(people: &Vec<Person>) -> &Person {
''',
    'footer': '}',
    'programs': [
        {
            'cond': 'fused',
            'correct': True,
            'program': '''
let mut youngest: Option<&Person> = None;
for person in people {
  if person.age > 18 && 
     (youngest.is_none() || person.age < youngest.unwrap().age) 
  {
    youngest = Some(person);
  }
}
return youngest.unwrap();
        '''
        },
        {
            'cond': 'fused',
            'correct': False,
            'program': '''
let mut youngest: Option<&Person> = None;
for person in people {
  if person.age < 18 && (youngest.is_none() || person.age < youngest.unwrap().age) 
  {
    youngest = Some(person);
  }
}
return youngest.unwrap();
        '''
        },
        {
            'cond': 'separate',
            'correct': True,
            'program': '''
let mut young_people = Vec::new();
for person in people {
  if person.age > 18 {
    young_people.push(person);
  }
}

let mut youngest = &young_people[0];
for person in &young_people[1..] {
  if person.age < youngest.age {
    youngest = &person;
  }
}

return youngest;
        '''
        },
        {
            'cond': 'separate',
            'correct': False,
            'program': '''
let mut young_people = Vec::new();
for person in people {
  if person.age < 18 {
    young_people.push(person);
  }
}

let mut youngest = &young_people[0];
for person in &young_people[1..] {
  if person.age < youngest.age {
    youngest = &person;
  }
}

return youngest;
        '''
        },
        {
            'cond': 'hof',
            'correct': True,
            'program': '''
people.iter()
      .filter(|person| person.age > 18)
      .min_by_key(|person| person.age)
      .unwrap()
            '''
        },
        {
            'cond': 'hof',
            'correct': False,
            'program': '''
people.iter()
      .filter(|person| person.age < 18)
      .min_by_key(|person| person.age)
      .unwrap()
            '''
        },
    ]
}
