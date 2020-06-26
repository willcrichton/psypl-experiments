import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Sequence, SequenceChildProps as SeqProps} from 'react-sequence-typed';

import {Experiment, Explanation} from 'experiment';

const BASE_URL = 'https://mindover.computer';
declare var EXPERIMENT_NAME: string;

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
  /* <p>
     <input type="submit" value="Click here to conclude the HIT"/>
     <input type="hidden" name="experiment" value={JSON.stringify(experiment)} />
     <input type="hidden" name="results" value={JSON.stringify(this.results)} />
     </p> */
  return <p>The experiment is complete. Thank you for your participation!</p>;
};

class ExperimentContainer extends React.Component {
  state = { participant: null, experiment: null }
  results: any = null

  componentDidMount() {
    axios.get(
      `${BASE_URL}/generate_experiment`,
      {params: {experiment: EXPERIMENT_NAME, n_trials: 20}}
    ).then(({data}) => this.setState({ experiment: data }));
  }

  save_results() {
    axios.post(
      `${BASE_URL}/record_results`,
      {experiment: EXPERIMENT_NAME,
       description: this.state.experiment!,
       participant: this.state.participant!,
       results: this.results});
  }

  render() {
    return <div className='experiment'>
      <Sequence>
        {(props: SeqProps) => <NameForm next={(name: string) => {
          this.setState({participant: name});
          props.next();
        }} />}

        {(props: SeqProps) => <Explanation start={props.next} />}

        {(props: SeqProps) => <Experiment
          save_results={(results: any) => {this.results = results;}}
          on_finished={() => { this.save_results(); props.next(); }}
          {...this.state.experiment!} />}

        {(props: SeqProps) => <ThankYou {...props} />}
      </Sequence>
    </div>;
  }
}

ReactDOM.render(<ExperimentContainer />, document.getElementById('experiment-container'));
