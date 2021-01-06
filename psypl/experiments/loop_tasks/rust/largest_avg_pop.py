TASK = {
    'prompt': 'This function should take a vector of Country objects and return the continent with the highest average population.',
    'test': '''assert_eq!(
  largest_avg_pop(&vec![
    Country{population: 5, continent: "A".into()},
    Country{population: 5, continent: "A".into()},
    Country{population: 1, continent: "B".into()},
    Country{population: 12, continent: "B".into()},
  ]),
  "B")''',
    'header': '''
use std::collections::{HashSet, HashMap};
struct Country { population: usize, continent: String }
fn largest_avg_pop(countries: &Vec<Country>) -> &String {
''',
    'footer': '}',
    'programs': [
        {
            'cond': 'fused',
            'correct': True,
            'program': '''
let mut pop_by_continent = HashMap::new();
for country in countries {
  let continent = &country.continent;
  let (sum, count) = pop_by_continent.entry(continent).or_insert((0, 0));
  *sum += country.population;
  *count += 1;
}

let mut max_continent: Option<&String> = None;
let mut max_average: Option<usize> = None;
for (continent, (sum, count)) in pop_by_continent {
  let average = sum / count;
  if max_average.is_none() || max_average.unwrap() < average {
    max_continent = Some(continent);
    max_average = Some(average);
  }
}

return max_continent.unwrap();
'''
        },
        {
            'cond': 'fused',
            'correct': False,
            'program': '''
let mut pop_by_continent = HashMap::new();
for country in countries {
  let (sum, count) = 
    pop_by_continent.entry(&country.continent).or_insert((0, 0));
  *sum += country.population;
  *count += 1;
}

let mut max_continent: Option<&String> = None;
let mut max_average: Option<usize> = None;
for (continent, (sum, count)) in pop_by_continent {
  let average = sum / count;
  if max_average.is_none() || max_average.unwrap() < average {
    max_continent = Some(continent);
  }
}

return max_continent.unwrap();
'''
        },
        {
            'cond': 'separate',
            'correct': True,
            'program': '''
let mut continents = HashSet::new();
for country in countries {
  continents.insert(&country.continent);
}

let mut avg_populations = Vec::new();
for continent in continents {
  let mut in_continent = Vec::new();
  for country in countries {
    if &country.continent == continent {
      in_continent.push(&country.population);
    }
  }

  let (mut count, mut sum) = (0, 0);
  for population in in_continent {
    count += 1;
    sum += population;
  }

  avg_populations.push((continent, sum / count));           
}

let (mut max_continent, mut max_average) = &avg_populations[0];
for (continent, population) in &avg_populations[1..] {
  if *population > max_average {
    max_continent = continent;
    max_average = *population;
  } 
}

return max_continent;
'''
        },
        {
            'cond': 'separate',
            'correct': False,
            'program': '''
let mut continents = HashSet::new();
for country in countries {
  continents.insert(&country.continent);
}

let mut avg_populations = Vec::new();
for continent in continents {
  let mut in_continent = Vec::new();
  for country in countries {
    in_continent.push(&country.population);
  }

  let (mut count, mut sum) = (0, 0);
  for population in in_continent {
    count += 1;
    sum += population;
  }

  avg_populations.push((continent, count / sum));           
}

let (mut max_continent, mut max_average) = &avg_populations[0];
for (continent, population) in &avg_populations[1..] {
  if *population > max_average {
    max_continent = continent;
    max_average = *population;
  } 
}

return max_continent;
'''
        },
        {
            'cond': 'hof',
            'correct': True,
            'program': '''
let continents: HashSet<&String> = 
  countries.iter().map(|country| &country.continent).collect();

let (max_continent, _): (&String, usize) = continents.into_iter()
  .map(|continent| {
    let in_continent = countries.iter()
      .filter(|country| &country.continent == continent)
      .map(|country| country.population);
    let average = in_continent.clone().sum::<usize>() / in_continent.count();
    (continent, average)
  })
  .max_by_key(|(_, average)| *average)
  .unwrap();
max_continent   
'''
        },
        {
            'cond': 'hof',
            'correct': False,
            'program': '''
let continents: HashSet<&String> = 
  countries.iter().map(|country| &country.continent).collect();

let (max_continent, _): (&String, usize) = continents.into_iter()
  .map(|continent| {
    let in_continent = countries.iter()
      .map(|country| country.population);
    let average = in_continent.clone().sum::<usize>() / in_continent.count();
    (continent, average)
  })
  .max_by_key(|(_, average)| *average)
  .unwrap();

max_continent
'''
        }

    ]
}
