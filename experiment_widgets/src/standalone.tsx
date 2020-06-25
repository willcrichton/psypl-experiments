import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

import {Experiment, Explanation} from 'experiment';

const BASE_URL = 'https://mindover.computer';
declare var EXPERIMENT_NAME: string;

class ExperimentContainer extends React.Component {
  state = { started: false, finished: false, experiment: null }
  results: any = null

  componentDidMount() {
    axios.get(
      `${BASE_URL}/generate_experiment`,
      {params: {experiment: EXPERIMENT_NAME, n_trials: 10}}
    ).then(({data}) => this.setState({ experiment: data }));
  }

  componentDidUpdate() {
    if (this.state.finished) {
      axios.post(
        `${BASE_URL}/record_results`,
        {experiment: EXPERIMENT_NAME, description: this.state.experiment!, results: this.results});
    }
  }

  render() {
    let start = () => {this.setState({started: true})};
    return <div className='experiment'>{
      !this.state.started
        ? <div>
          <Explanation start={start}/>
        </div>
        : (!this.state.finished
          ? <Experiment
              save_results={(results: any) => {this.results = results;}}
              on_finished={() => {this.setState({finished: true})}}
              {...this.state.experiment!} />
          : <div>
            <p>The experiment is complete. Thank you for your participation!</p>
          {/* <p>
              <input type="submit" value="Click here to conclude the HIT"/>
              <input type="hidden" name="experiment" value={JSON.stringify(experiment)} />
              <input type="hidden" name="results" value={JSON.stringify(this.results)} />
              </p> */}
          </div>)
    }</div>;
  }
}

ReactDOM.render(<ExperimentContainer />, document.getElementById('experiment-container'));
