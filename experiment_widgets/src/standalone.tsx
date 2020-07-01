import React from 'react';
import ReactDOM from 'react-dom';
import {Sequence, SequenceChildProps as SeqProps} from 'react-sequence-typed';

import {Experiment, Explanation} from 'experiment';
import {get_experiment, record_results} from './common';
import '../css/widget.scss';


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

class ExplanationWrapper extends React.Component<{start: () => void}> {
  state = {box_checked: false}

  render() {
    return <div>
      <Explanation />

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
    </div>;
  }
}

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
    get_experiment().then(({data}) => this.setState({experiment: data}));
  }

  save_results() {
    record_results(this.state.experiment!, this.state.participant!, this.results);
  }

  render() {
    return <div className='experiment'>
      <Sequence>
        {(props: SeqProps) => <NameForm next={(name: string) => {
          this.setState({participant: name});
          props.next();
        }} />}

        {(props: SeqProps) => <ExplanationWrapper start={props.next} />}

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
