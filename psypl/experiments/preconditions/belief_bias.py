from psypl.base import Experiment
from psypl.utils import shuffle
import experiment_widgets
from enum import IntEnum


class BeliefBiasExperiment(Experiment):
    class Content(IntEnum):
        Abstract = 1
        Realistic = 2

    stimuli = [
        {
            "name": "email",
            "programs": [{
                "condition": Content.Realistic,
                "func": "get_domain",
                "source": """
String get_domain(String email) {
  String[] parts = string.split("@");
  String[] subparts = parts[1].split(".");

  if (subparts.length > 0) {
    return subparts[0];
  } else {
    return new String("");
  } 
}
"""
            }, {
                "condition": Content.Abstract,
                "func": "mystery",
                "source": """
String mystery(String s) {
  String[] a = s.split("!");
  String[] b = a[1].split("#");
  
  if (b.length > 0) {
    return b[0];
  } else {
    return new String("");
  }
}
"""
            }]
        },
 
        {
            "name": "animal_height",
            "programs": [{
                "condition": Content.Realistic,
                "func": "ratio_of_totals",
                "source": """
interface Animal {
  public String type();
  public int height();
}

// The /* .. */ means this function is implemented, but you don't
// get to assume anything about the implementation.
class Dog implements Animal {
  public void bark() { /* .. */ }
  public String type() { /* .. */ }
  public int height() { /* .. */ }
}

class Cat implements Animal {
  public void meow() { /* .. */ }
  public String type() { /* .. */ }
  public int height() { /* .. */ }
}

Double ratio_of_totals(List<Animal> animals) {
  Double cat_height = 0.;
  Double dog_height = 0.;
  for (Animal animal : animals) {
    if (animal.type().equals("Dog")) {
      ((Dog) animal).bark();
      dog_height += animal.height();
    } else if (animal.type().equals("Cat")) {
      ((Cat) animal).meow();
      cat_height += animal.height();
    }
  }
  return cat_height / dog_height;
}
        """
            }, {
                "condition": Content.Abstract,
                "func": "mystery",
                "source": """
interface A {
  public String str();
  public int num();
}

// The /* .. */ means this function is implemented, but you don't
// get to assume anything about the implementation.
class B implements A {
  public void do_b() { /* .. */ }
  public String str() { /* .. */ }
  public int num() { /* .. */ }
}

class C implements A {
  public void do_c() { /* .. */ }
  public String str() { /* .. */ }
  public int num() { /* .. */ }
}

Double mystery(List<A> objs) {
  Double b_total = 0.;
  Double c_total = 0.;
  for (A a : objs) {
    if (a.str().equals("foo")) {
      ((B) b).do_b();
      b_total += a.num();
    } else if (a.str().equals("bar")) {
      ((C) c).do_c();
      c_total += a.num();
    }
  }
  return b_total / c_total;
}
"""
            }]
        }
    ]

    def generate_experiment(self, **kwargs):
        n_trials = len(self.stimuli)
        idxs = shuffle(list(range(n_trials)))
        pivot = n_trials // 2
        (abstract_idxs, realistic_idxs) = (idxs[:pivot], idxs[pivot:])
        return {
            'trials': shuffle([
                self.generate_trial(idx, self.Content.Abstract)
                for idx in abstract_idxs
            ] + [
                self.generate_trial(idx, self.Content.Realistic)
                for idx in realistic_idxs
            ]),
            'trial_time': 600,
            'between_trials_time': 5000,
            'break_frequency': 10
        }

    def generate_trial(self, idx, cond):
        stimulus = self.stimuli[idx]
        program = [s for s in stimulus['programs'] if int(s['condition']) == int(cond)][0]
        return {
            'name': stimulus['name'],
            'cond': str(cond),
            'func': program['func'],
            'program': program['source'].strip()
        }

    def eval_trial(self, trial, result):
        return result
