import React from 'react';
import ReactDOM from 'react-dom';
import {Sequence, SequenceChildProps as SeqProps} from 'react-sequence-typed';
import axios from 'axios';
import '../css/widget.scss';

import {Experiment, instruction_params} from 'experiment';
import {Instructions} from './instructions';

const BASE_URL = 'https://mindover.computer/api';
declare var EXPERIMENT_NAME: string;
declare var MTURK: boolean;

export function get_experiment(): Promise<any> {
  return axios.get(
    `${BASE_URL}/generate_experiment`,
    {params: {experiment: EXPERIMENT_NAME}}
  );
}

export function record_results(description: any, participant: string, results: any) {
  axios.post(
      `${BASE_URL}/record_results`,
      {experiment: EXPERIMENT_NAME, description, participant, results});
}

let NameForm = (props: {next: (name: string) => void}) => {
  return <div>
    <div>Input your name, then press enter:</div>
    <input
      type="text"
      autoFocus={true}
      onKeyPress={(e) => {
        if (e.key == 'Enter') {
          props.next((e.target as HTMLInputElement).value);
        }}} />
  </div>;
};

let ThankYou = (props: SeqProps) => {
  return <div>
    <p>The experiment is complete. Thank you for your participation!</p>
    {MTURK
    ? <p><input type="submit" value="Click here to conclude the HIT"/></p>
    : null}
  </div>
};


let participant: string | null;
if (MTURK) {
  const url_params = new URLSearchParams(window.location.search);
  participant = `mturk-${url_params.get('workerId')}`;
} else {
  participant = null;
}


class ExperimentContainer extends React.Component {
  state = { participant, experiment: null, finished: false }
  results: any[] = []

  componentDidMount() {
    get_experiment().then(({data}) => this.setState({experiment: data}));

    if (MTURK) {
      const form = document.getElementById('mturk_form')!;
      form.onsubmit = () => {
        return this.state.finished;
      }
    }
  }

  save_results() {
    record_results(this.state.experiment!, this.state.participant!, this.results);
    this.setState({finished: true});
  }

  render() {
    return <div className='experiment'>
      {this.state.participant == null
      ? <NameForm next={(name: string) => {
        this.setState({participant: name});
      }} />
      : <Sequence>
         {(props: SeqProps) => <Instructions start={props.next} experiment={this.state.experiment}
                                            params={instruction_params} />}

         {(props: SeqProps) => <Experiment
                                save_results={(results: any) => {this.results.push(results);}}
                                on_finished={() => { this.save_results(); props.next(); }}
                                {...this.state.experiment!} />}

         {(props: SeqProps) => <ThankYou {...props} />}
       </Sequence>}
    </div>;
  }
}

ReactDOM.render(<ExperimentContainer />, document.getElementById('experiment-container'));
