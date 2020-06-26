import React from 'react';

import {TrialProps, make_multiple_trials} from '../common';

interface TrialData {
  prog: string
}

let trial_view = (props: TrialProps<TrialData>) => {
  let start = new Date().getTime();
  let input_ref = React.createRef<HTMLInputElement>();

  let trial_finished = () => {
    let now = new Date().getTime();
    props.finished({
      response: input_ref.current!.value,
      response_time: now - start
    });
  };

  return <div>
    <pre>{props.trial.prog}</pre>
    <input className='exp-input' type='text'
           autoFocus
           onKeyDown={(e) => { if (e.key == 'Enter') { trial_finished(); }}}
           ref={input_ref} />
    <button onClick={trial_finished}>Next</button>
  </div>;
};


export let Experiment =
  make_multiple_trials<TrialData>(trial_view);
export let Explanation = (props: any) => <div />;