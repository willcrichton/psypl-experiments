import React from 'react';

import {TrialProps, make_multiple_trials} from './common';

interface TrialData {
  variables: {variable: string, value: number}[]
  expression: string
}

declare global { interface Window { Jupyter: any } }

class TrialView extends React.Component<TrialProps<TrialData>, {var_screen: boolean, switch_count: number, start_time: number}> {
  state = {var_screen: true, switch_count: 0, start_time: 0}
  input_ref: React.RefObject<HTMLInputElement>

  constructor(props: TrialProps<TrialData>) {
    super(props);
    this.input_ref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('keydown', (event) => {
      if (event.key == 'ArrowLeft' && !this.state.var_screen) {
        this.setState({var_screen: true, switch_count: this.state.switch_count + 1});
      } else if (event.key == 'ArrowRight' && this.state.var_screen) {
        this.setState({var_screen: false, switch_count: this.state.switch_count + 1});
      }
    });
    this.setState({start_time: (new Date()).getTime()});
    window.Jupyter.keyboard_manager.disable();
  }


  componentDidUpdate(prev_props: any) {
    if (prev_props != this.props) {
      this.setState({var_screen: true, switch_count: 0});
    }

    if (this.input_ref.current) {
      this.input_ref.current.focus();
    }
  }

  render() {
    let trial = this.props.trial;
    if (this.state.var_screen) {
      let prog = trial.variables.map((v) => `${v.variable} = ${v.value}`).join('\n');
      return <div>
        <pre>{prog}</pre>
      </div>;
    } else {
      let trial_finished = () => {
        let now = (new Date()).getTime();
        window.Jupyter.keyboard_manager.disable();
        this.props.finished({
          response: this.input_ref.current!.value,
          switch_count: this.state.switch_count,
          response_time: now - this.state.start_time
        });
      };
      return <div>
        <pre>{trial.expression}</pre>
        <input className='exp-input' type='text'
               onKeyDown={(e) => { if (e.key == 'Enter') { trial_finished(); }}}
               ref={this.input_ref} />
        <button onClick={trial_finished}>Next</button>
      </div>;
    }
  }
}

export let VariableTracingExperiment =
  make_multiple_trials<TrialData>(TrialView);
