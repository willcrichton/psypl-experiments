import React, {useState, useRef, useEffect, useContext} from 'react';
import {instruction_templates, TaskDescriptionProps, SampleTrial} from 'instructions';
import {TrialProps, make_multiple_trials, ProgressBar, CodeView, make_trial_sequence, TrialStageProps, ExperimentContext} from 'common';

interface TrialData {
  program: string
  func: string
}

let TrialView = (props: TrialProps<TrialData>) => {
  let trial = props.trial;
  let experiment = useContext(ExperimentContext)!;
  let trial_time = experiment.trial_time * 1000;

  let input = useRef<HTMLTextAreaElement>(null);
  let done = () => props.finished({answer: input.current!.value});

  useEffect(() => {
    setTimeout(done, trial_time);
  });

  return <div>
    <CodeView language="java" program={trial.program} />
    <div>What is the best specification for <code>{trial.func}</code>?</div>
    <div style={{marginTop: '20px'}}>
      <textarea ref={input}>
      </textarea>
    </div>
    <button onClick={done} className='primary'>Submit</button>
    <ProgressBar duration={trial_time} />
  </div>;
};

export let Experiment = make_multiple_trials<TrialData>(TrialView);

let trial_data: TrialData = {
  program: `void mystery(String s, double n) {
  if (s.equals("hello")) {
    System.out.println(1. / n);
  }
}`,
  func: 'mystery'
};

let guided_stage1 = (props: TrialStageProps<TrialData, any>) =>
  <TrialView trial={props.trial} finished={results => props.next_stage(results)} />;

let guided_stage2 = (props: TrialStageProps<TrialData, any>) =>
  <div>
    <p>For the function:</p>
    <CodeView language="java" program={props.trial.program} />
    <p>You wrote:</p>
    <p className='indent'>{props.state.answer}</p>
    <p>As a comparison, the experimenter's answer would have been:</p>
    <p className='indent'>
      <code>s</code> is not null, and if <code>s</code> equals "hello" then <code>n</code> is not zero.
    </p>
    <button onClick={() => props.trial_finished(null)}>Continue</button>
  </div>;

let GuidedTrial = make_trial_sequence([guided_stage1, guided_stage2]);

let TaskDescription = (props: TaskDescriptionProps) =>
  <div>
    <p>This is an experiment about exceptions in Java functions. You will be presented with a Java program, and your goal is to write an English specification that documents which inputs are guaranteed to not raise an exception.</p>
    <h2>Example</h2>
    <p>For example, if the function is:</p>
    <CodeView language="java" program={`int get_next(int[] array, int i) {
  return array[i + 1];
}`} />
    <p>Then this function raises an exception when the array index is out of bounds. Specifically if <code>i + 1</code> is not between 0 and the length of <code>array</code> minus 1. So a valid specification would look like:</p>
    <p className='indent'>
      "<code>i</code> must be between -1 and the length of <code>array</code> minus 2"
    </p>
    <h2>Specification notation</h2>
    <p>You can write your specifications however feels most natural. For example, you could use pseudocode:</p>
    <p className='indent'>
      "<code>{"-1 <= i"}</code> and <code>{"i <= |array| - 2"}</code>"
    </p>
    <h2>Most accepting specification</h2>
    <p>
      Your specification should accept <strong>as many inputs as possible</strong> without raising an exception. For example, this specification is too restrictive because <code>i</code> can be <code>-1</code> without raising an exception.
    </p>
    <p className='indent'>
      "<code>{"0 <= i"}</code> and <code>{"i <= |array| - 2"}</code>"
    </p>
    <h2>Kinds of exceptions</h2>
    <p>You will need to watch out for these exceptions:</p>
    <ul>
      <li><strong>Null pointers:</strong> any non-primitive object (e.g. <code>String</code> or <code>List</code>) can be null. Calling a method on a null pointer raises an exception.</li>
      <li><strong>Divide-by-zero:</strong> any division operations must have the right-hand expression be non-zero (e.g. 3/2).</li>
      <li><strong>Array indexing:</strong> indexing an array or string (e.g. <code>array[i]</code>) must be within the bounds of the array.</li>
      <li><strong>Downcasting:</strong> an object must be cast from a parent class to the correct sub-class.</li>
    </ul>
    <h2>Intention versus reality</h2>
    <p>Lastly, you might read a function and guess at the high-level intention behind the code. <strong>Do not write your specification against your guessed intention</strong> &mdash; write your specification against the actual function implementation.</p>
    <SampleTrial TrialView={GuidedTrial} on_finish={props.done}
                 criterion={(trial: TrialData, response: {response: any}) => true}
                 trial_data={trial_data} />
  </div>;

let instructions = [];

export let instruction_params = {TaskDescription, instructions}
