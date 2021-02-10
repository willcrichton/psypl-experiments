import React, {useState} from 'react';
import Editor from '@monaco-editor/react';

import {instruction_templates, TaskDescriptionProps, SampleTrial} from '../instructions';
import {TrialProps, make_multiple_trials, ProgressBar} from '../common';

interface TrialData {
  prompt: string
  answer: boolean
  test: string
  program: string
}

let CodeView = (props: {program: string}) =>
  <Editor
    language="rust"
    height={Math.min(500, props.program.split('\n').length * 25)}
    value={props.program}
    options={{
      readOnly: true,
      scrollBeyondLastLine: false,
      minimap: {enabled: false},
      fontSize: 16,
      lineNumbers: "off",
      folding: false
    }} />;

let AnswerBar = (props: {correct: boolean, finished: (response: any) => void}) => {
  let [answer, set_answer] = useState<boolean | undefined>(undefined);
  let [submitted, set_submit] = useState<boolean>(false);
  return <p style={{marginBottom: '0'}}>
    <hr />
    Does the function match the specificaton?<br />
    <input type="radio" name="answer" disabled={submitted} onClick={() => set_answer(true)} /> Yes &nbsp;
    <input type="radio" name="answer" disabled={submitted} onClick={() => set_answer(false)} /> No &nbsp;
    <button disabled={answer === undefined || submitted} onClick={() => {
      setTimeout(() => props.finished({response: answer}), 2000);
      set_submit(true)
    }}>Submit answer</button>
    {submitted
    ? <span className={(props.correct == answer ? 'correct' : 'incorrect')}>
      <span className='correct-indicator'>
        {props.correct == answer ? <>✓</> : <>✗</>}
      </span>
      <ProgressBar duration={2000} />
    </span>
    : null}
  </p>;
};

let TrialView = (props: TrialProps<TrialData>) => {
  let trial = props.trial;
  let program = '// For example, the function should pass this test:\n' + trial.test + ';\n\n' + trial.program;
  return <div>
    <p>{trial.prompt}</p>
    <CodeView program={program} />
    <AnswerBar correct={trial.answer} finished={props.finished} />
  </div>;
};

export let Experiment = make_multiple_trials<TrialData>(TrialView);

let trial_data: TrialData = {
  prompt: 'This function should take a vector of numbers as input, and return the sum of the even-valued numbers as output.',
  answer: false,
  test: 'assert_eq!(sum_evens(vec![1, 2, 3, 4], 6))',
  program: `fn sum_evens(nums: Vec<i32>) -> i32 {
  let mut sum = 0;
  for i in 0 .. nums.len() {
    if nums[i] % 2 == 0 {
      sum += i;
    }
  }
}`
};

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment about understanding Rust programs that process lists. You will be presented with a program, and your goal is to determine whether it correctly implements a high-level specification. For example, consider the spec: a function that takes a list of strings as input, and returns the last string containing the letter "w". If you're presented with this function:</p>
    <CodeView program={`fn last_w_string(strings: &Vec<String>) -> Option<&String> {
  strings.iter()
    .rev()
    .filter(|s| s.contains("w"))
    .next()
}`} />
    <p>Then this program correctly implements the specification. If you're presented with this function:</p>
    <CodeView program={`fn last_w_string(strings: &Vec<String>) -> Option<&String> {
  strings.iter()
    .filter(|s| s.contains("w"))
    .next()
}`} />
    <p>Then it does not correctly implement the specification, because it finds the <i>first</i> string containing a "w". Try out a sample trial:</p>
    <SampleTrial TrialView={TrialView} on_finish={props.done}
                 criterion={(trial: TrialData, response: {response: any}) => trial.answer == response.response}
                 trial_data={trial_data} />
  </div>;


// TODO: don't need to read docs
// checkmark: correct answer vs. correctly submitted
// explain needed Rust competency
// if they guess

let instructions = [
  <>You are not allowed to use external resources, except for the reference documentation for <a href="https://doc.rust-lang.org/std/iter/trait.Iterator.html" target="_blank">Iterator</a>, <a href="https://doc.rust-lang.org/beta/std/collections/struct.HashMap.html" target="_blank">HashMap</a>, and <a href="https://doc.rust-lang.org/beta/std/collections/struct.HashSet.html" target="_blank">HashSet</a>. <strong>Open these links now.</strong></>
  //<>{instruction_templates['no-tools']} {instruction_templates['no-scratch']}</>
];

export let instruction_params =
  {TaskDescription, instructions};
