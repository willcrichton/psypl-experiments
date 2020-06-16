import React from 'react';

import {TrialProps, make_multiple_trials, ValueInput} from './common';

interface TrialData {
  program: string
}

let TrialView = (props: TrialProps<TrialData>) => {
  return <div>
    <pre>{props.trial.program}</pre>
    <ValueInput onEnter={(value) => props.finished({'response': value})} />
  </div>
};

export let FunctionBasicExperiment = make_multiple_trials<TrialData>(TrialView);
