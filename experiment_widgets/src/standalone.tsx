import React from 'react';
import ReactDOM from 'react-dom';

import {VariableCuedRecallExperiment, Explanation, generate_experiment} from './variable_cued_recall';

let experiment = generate_experiment();

class Experiment extends React.Component {
  state = { started: false, finished: false }
  results: any = null

  render() {
    let start = () => {this.setState({started: true})};
    return <div className='experiment'>{
      !this.state.started
        ? <div>
          <Explanation start={start}/>
        </div>
        : (!this.state.finished
          ? <VariableCuedRecallExperiment
              save_results={(results: any) => {this.results = results;}}
              on_finished={() => {this.setState({finished: true})}}
              {...experiment} />
          : <div>
            <p>The experiment is complete. Thank you for your participation!</p>
            <p>
              <input type="submit" value="Click here to conclude the HIT"/>
              <input type="hidden" name="experiment" value={JSON.stringify(experiment)} />
              <input type="hidden" name="results" value={JSON.stringify(this.results)} />
            </p>
          </div>)
    }</div>;
  }
}

ReactDOM.render(<Experiment />, document.getElementById('experiment-container'));
