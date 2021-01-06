from ...hof_quiz_shared import Condition, Program, Task

TASK = Task(
    name='youngest_over_18',
    prompt='This function should take a vector of Person objects and return the youngest person older than 18.',
    test='''assert(
  youngest_over_18([{'age': 17}, {'age': 18}, {'age': 19}, {'age': 20}]) == {'age': 19})''',
    header='def youngest_over_18(people):',
    footer='',
    programs=[
        Program(
            cond=Condition.LoopFused,
            correct=True,
            program='''
youngest = None
for person in people:
  age = person['age']
  if age > 18 and (youngest is None or age < youngest['age']):
    youngest = person
return youngest
'''
        ),

        Program(
            cond=Condition.LoopSeparate,
            correct=True,
            program='''
over_18 = []
for person in people:
  if person['age'] > 18:
    over_18.append(person)

youngest = None
for person in over_18:
  if youngest is None or person['age'] < youngest['age']:
    youngest = person

return youngest
            '''),

        Program(
            cond=Condition.HOF,
            correct=True,
            program='''
over_18 = filter(lambda person: person['age'] > 18)
youngest = min(over_18, key=lambda person: person['age'])
return youngest
            ''')
    ])

  
