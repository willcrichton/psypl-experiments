from enum import Enum
from dataclasses import dataclass
from typing import List
import textwrap

class Condition(Enum):
    LoopSeparate = 1
    LoopFused = 2
    HOF = 3
    Comprehension = 4
    Dataframe = 5

@dataclass
class Program:
    cond: Condition
    correct: bool
    program: str

@dataclass
class Task:
    name: str
    prompt: str
    test: str
    header: str
    footer: str
    language: str
    programs: List[Program]

    def gen_program(self, program: Program) -> str:
        program = textwrap.indent(program.program.strip(), ' '*4)
        return f'{self.header.strip()}\n{program}\n{self.footer.strip()}'
