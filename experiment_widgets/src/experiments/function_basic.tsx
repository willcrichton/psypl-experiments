import React, {useState} from 'react';

import {TrialProps, make_multiple_trials, ValueInput, ProgressBar} from '../common';

export interface TrialData {
  program: string,
  call?: string,
  answer: number
}

export let sample_criterion = (trial: TrialData, response: any) => {
  return parseInt(response.response) == trial.answer;
};


export let TrialView = (props: TrialProps<TrialData>) => {
  let [answer, set_answer] = useState<string | null>(null);
  return <div>
    <pre>{props.trial.program}</pre>
    <hr />
    <div>{props.trial.call
        ? <span>The value of <code>{props.trial.call!}</code> is:</span>
        : <span>The value of the expression is:</span>}
    </div>
    {answer !== null
     ? <>
       <ValueInput value={answer} disabled={true} correct={parseInt(answer) == props.trial.answer}
                   answer={props.trial.answer} />
       <ProgressBar duration={3000} />
     </>
     : <ValueInput onEnter={(value) => {
       setTimeout(() => {
         props.finished({'response': value});
       }, 3000);
       set_answer(value);
     }} />}
  </div>
};

export let Experiment = make_multiple_trials<TrialData>(TrialView);

export let Explanation = (props: any) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the result of a series of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>
  </div>;
