import React from 'react';

import {TrialProps, make_multiple_trials, ValueInput} from '../common';

interface TrialData {
  program: string
  call?: string
}

export let TrialView = (props: TrialProps<TrialData>) => {
  return <div>
    <pre>{props.trial.program}</pre>
    <hr />
    <div>{props.trial.call
        ? <span>The value of <code>{props.trial.call!}</code> is:</span>
        : <span>The value of the expression is:</span>}
    </div>
    <ValueInput onEnter={(value) => props.finished({'response': value})} />
  </div>
};

export let Experiment = make_multiple_trials<TrialData>(TrialView);

export let Explanation = (props: any) =>
  <div>
    <p>This is an experiment to test your ability to mentally compute the result of a series of short Python programs. Your task is to compute the answer accurately, and as quickly as possible. Your time to answer will be measured.</p>
  </div>;
