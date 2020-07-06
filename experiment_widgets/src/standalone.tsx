import React from 'react';
import ReactDOM from 'react-dom';
import {Sequence, SequenceChildProps as SeqProps} from 'react-sequence-typed';
import axios from 'axios';
import '../css/widget.scss';

import {Experiment, Explanation, TrialView} from 'experiment';

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

export class SampleTrial extends React.Component<{TrialView: any, on_finish: () => void}> {
  state = {playing: false, trials: [], cur_trial: 0}

  componentDidMount() {
    get_experiment().then(({data}) => {
      this.setState({trials: data.trials});
    });
  }

  render() {
    let TrialView = this.props.TrialView;
    return this.state.playing
         ? (this.state.trials.length > 0
          ? <div className="indent">
              <TrialView
                trial={this.state.trials[this.state.cur_trial]}
                finished={() => {
                  this.setState({
                    playing: false,
                    cur_trial: (this.state.cur_trial + 1) % (this.state.trials.length)
                  });
                  this.props.on_finish();
                }} />
            </div>
          : <div>Loading...</div>)
         : <button onClick={() => {this.setState({playing: true})}}>Click here to try a sample trial</button>;
  }
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

class ExplanationWrapper extends React.Component<{start: () => void, experiment?: any}> {
  state = {box_checked: false, sample_tried: false}

  render() {
    return <div className='explanation-wrapper'>
      <div className='explanation'>
        <Explanation experiment={this.props.experiment} />
      </div>

      <SampleTrial TrialView={TrialView} on_finish={() => this.setState({sample_tried: true})} />

      {this.state.sample_tried
      ? <div>
        <p style={{fontSize: '75%'}}><i>You can click the button multiple times to try different trials.</i></p>

        <p>Once you understand the task, please read the following instructions.</p>

        <ul>
          <li>You must give this experiment your undivided attention for its duration. A 30-second break will be provided every 10 trials.</li>
          <li>Please participate in an environment without distractions, either sounds or images.</li>
          <li>If you aren't sure of an answer, you should guess.</li>
          <li><strong>DO NOT</strong> use pen & paper, a digital notepad, or any other tool to help your memory during the experiment. Do not use the input box as a scratchpad.</li>
        </ul>

        <p>
          I understand the task and instructions above:
          <input type="checkbox" onChange={(e) => {
            this.setState({box_checked: e.target.checked})
          }} />
        </p>

        <p>
          <button
            onClick={() => {if (this.state.box_checked) { this.props.start(); }}}
            className={`primary ${this.state.box_checked ? '' : 'disabled'}`}>
            Start the experiment
          </button>
        </p>
      </div>
      : null}
    </div>;
  }
}

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
  participant = url_params.get('workerId');
} else {
  participant = null;
}

class ExperimentContainer extends React.Component {
  state = { participant, experiment: null }
  results: any = null

  componentDidMount() {
    get_experiment().then(({data}) => this.setState({experiment: data}));
  }

  save_results() {
    record_results(this.state.experiment!, this.state.participant!, this.results);
  }

  render() {
    return <div className='experiment'>
      {participant == null
      ? <Sequence>
        {(props: SeqProps) => <NameForm next={(name: string) => {
          this.setState({participant: name});
          props.next();
        }} />}

        {(props: SeqProps) => <ExplanationWrapper start={props.next} experiment={this.state.experiment} />}

        {(props: SeqProps) => <Experiment
                               save_results={(results: any) => {this.results = results;}}
                               on_finished={() => { this.save_results(); props.next(); }}
                               {...this.state.experiment!} />}

        {(props: SeqProps) => <ThankYou {...props} />}
      </Sequence>
      : <Sequence>
        {(props: SeqProps) => <ExplanationWrapper start={props.next} experiment={this.state.experiment} />}

        {(props: SeqProps) => <Experiment
                               save_results={(results: any) => {this.results = results;}}
                               on_finished={() => { this.save_results(); props.next(); }}
                               {...this.state.experiment!} />}

        {(props: SeqProps) => <ThankYou {...props} />}
      </Sequence>}
    </div>;
  }
}

ReactDOM.render(<ExperimentContainer />, document.getElementById('experiment-container'));
