from ...hof_quiz_shared import Condition, Program, Task

TASK = Task(
    name='largest_average_population',
    prompt='This function should take a vector of Country objects and return the continent with the highest average population.',
    test='''assert(
  largest_average_pop([
    {'population': 5, 'continent': "A"},
    {'population': 5, 'continent': "A"},
    {'population': 1, 'continent': "B"},
    {'population': 12, 'continent': "B"},
  ]) == "B")''',
    header='def largest_average_pop(countries):',
    footer='',
    language='python',
    programs=[
        Program(
            cond=Condition.LoopFused,
            correct=True,
            program='''
continent_stats = {}
for country in countries:
    continent = country['continent']
    if continent not in continent_stats:
        continent_stats[continent] = [0, 0]

    continent_stats[continent][0] += country['population']
    continent_stats[continent][1] += 1

max_continent = None
max_average = None
for continent, (total, count) in continent_stats.items():
    average = total / count
    if max_average is None or average > max_average:
        max_continent = continent
        max_average = average

return max_continent
''',
        ),

        Program(
            cond=Condition.LoopSeparate,
            correct=True,
            program='''
continents = set()
for country in countries:
    continents.add(country['continent'])

averages = []
for continent in continents:
    in_continent = []
    for country in countries:
        if country['continent'] == continent:
            in_continent.append(country)

    populations = []
    for country in in_continent:
        populations.append(country['population'])

    total = 0
    for pop in populations:
        total += pop

    count = len(populations)
    average = total / count
    averages.append((continent, average))

max_average = None
max_continent = None
for (continent, average) in averages:
    if max_average is None or average > max_average:
        max_average = average
        max_continent = continent

return max_continent
''',
        ),

        Program(
            cond=Condition.HOF,
            correct=True,
            program='''
continents = set(map(lambda country: country['continent'], countries))

def compute_average(continent):
    in_continent = filter(lambda country: country['continent'] == continent,
                          countries)
    populations = list(map(lambda country: country['population'], in_continent))
    return (continent, sum(populations) / len(populations))

averages = map(compute_average, continents)
max_continent, _ = max(averages, key=lambda pair: pair[1])
return max_continent
            '''),
        
        Program(
            cond=Condition.Comprehension,
            correct=True,
            program='''
continents = set([country['continent'] for country in countries])

def compute_average(continent):
    populations = [
        country['population']
        for country in countries
        if country['continent'] == continent
    ]
    return sum(populations) / len(populations)

averages = [(continent, compute_average(continent)) for continent in continents]
max_continent, _ = max(averages, key=lambda pair: pair[1])
return max_continent
            '''),
        
        Program(
            cond=Condition.Dataframe,
            correct=True,
            program='''
import pandas as pd
countries = pd.DataFrame(countries)
mean_pop = countries.groupby('continent').population.mean()
return mean_pop.index[mean_pop.argmax()]
            ''')
    ])
