import React, {useEffect, useState} from 'react';
import {AccumulatingSequence, SequenceChildProps} from 'react-sequence-typed';

import {TrialProps, make_multiple_trials, ValueInput, ProgressBar} from '../common';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';

export interface TrialData {
  program: string,
  call?: string,
  answer: string
}

export let sample_criterion = (trial: TrialData, response: any) => {
  let answer = response.response.trim();
  if (answer === null) {
    return false;
  }

  if (answer[0] == '"' || answer[0] == "'") {
    answer = answer.slice(1, answer.length - 1);
  }

  return answer.toLowerCase() == trial.answer.toLowerCase();
};

interface ProgramViewerProps {
  program: string
  annotate: boolean
}

let ProgramViewer = (props: ProgramViewerProps) => {
  return <div className='program-viewer'>
    <pre>{props.program}</pre>
  </div>;
};

export interface AnswerBarProps {
  answer: string,
  timeout: number
  answer_time: number,
  check_answer: (answer: string) => boolean,
  finished: (response: any) => void,
  call?: string
}

export let AnswerBar = (props: AnswerBarProps) => {
  useEffect(() => {
    const timer = setTimeout(() => props.finished({'response': ''}), props.timeout * 1000);
    return () => clearTimeout(timer);
  }, []);

  let [answer, set_answer] = useState<string | undefined>(undefined);
  return <div>
    <div>{props.call
        ? <span>The value of <code>{props.call!}</code> is:</span>
        : <span>The value of the expression is:</span>}
    </div>
    {answer !== undefined
    ? <>
      <ValueInput value={answer!} disabled={true} large={true} correct={props.check_answer(answer!)}
                  answer={props.answer} />
      <ProgressBar key={0} duration={props.answer_time*1000} />
    </>
    : <>
      <ValueInput large={true} onEnter={(value) => {
        setTimeout(() => {
          props.finished({response: value});
        }, props.answer_time*1000);
        set_answer(value);
      }} />
      <ProgressBar key={1} duration={props.timeout*1000} />
    </>}
  </div>;
};

export let TrialView = (timeout: number, answer_time: number) => (props: TrialProps<TrialData>) => {
  return <div>
    <ProgramViewer program={props.trial.program} annotate={true} />
    <hr />
    <AnswerBar answer={props.trial.answer} timeout={timeout} answer_time={answer_time}
               check_answer={(answer: string) => sample_criterion(props.trial, {response: answer})}
               finished={props.finished} />
  </div>
};

export let Experiment = make_multiple_trials<TrialData>(TrialView(90, 2));

let cond1_data: TrialData = {
  program: `f = 9
e = 1 + f
x = f - e`,
  call: 'x',
  answer: '-1'
};

let cond2_data: TrialData = {
  program: `def n():
  return 9
def p(s):
  return s - 2
def c(e, s):
  return e + s

s = n()
e = p(s)
f = c(e, s)`,
  call: 'f',
  answer: '16'
};

let cond3_data: TrialData = {
  program: `def v():
  return 5
def o(x):
  return 8 - x
def b(q, l):
  return l - q

t = v()
w = o(t)
g = b(t, w)`,
  call: 'g',
  answer: '-2'
};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the output of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>


    <p>You will see three kinds of programs. The first is a straight-line sequence of variables assigned to arithmetic expressions. For example:</p>

    <p><pre>{`x = 1
y = x - 4
z = y - x`}</pre></p>

    <p>Your job is to compute the numeric value of the last variable using only your brain (no calculator, pencil, etc.). For example, the variable <code>z</code> above has a value of -4.</p>

    <p>Then type the answer into the provided input box. Negative numbers should be written like "-4" with a minus sign in front. Once you're done, press "Enter".</p>

    <AccumulatingSequence>
      {({next}: SequenceChildProps) =>
        <div>
          <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion}
                       trial_data={cond1_data} />
        </div>}
      {({next}: SequenceChildProps) =>
        <div>
          <p>The next kind of program replaces each expression with a function call. For example:</p>
          <p><pre>{`def f():
    return 1
def q(x):
    return x - 4
def w(y, x):
    return y - x

x = f()
y = q(x)
z = w(y, x)`}</pre></p>
          <p>Note that the function argument names are the same as the corresponding variable names. For example, the definition of <code>q</code> has a parameter <code>x</code>, and a variable named <code>x</code> is passed to <code>q</code>.</p>
          <SampleTrial TrialView={TrialView} on_finish={next} criterion={sample_criterion}
                       trial_data={cond2_data} />
        </div>}
      {(_: SequenceChildProps) =>
        <div>
          <p>The last kind of program also uses functions, except the function definition and function call variables have <strong>different</strong> names. For example:</p>
          <p><pre>{`def f():
    return 1
def q(a):
    return a - 4
def w(u, r):
    return u - r

x = f()
y = q(x)
z = w(y, x)`}
          </pre></p>
          <SampleTrial TrialView={TrialView} on_finish={props.done} criterion={sample_criterion}
                       trial_data={cond3_data} />
        </div>}

    </AccumulatingSequence>
  </div>;

let instructions = [
  <>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params = {TaskDescription, instructions};
