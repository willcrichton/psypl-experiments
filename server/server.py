from flask import Flask, render_template, request, jsonify
from psypl.experiments import EXPERIMENTS

app = Flask(__name__)
app.debug = True

def get_experiment(name):
    name = ''.join(name.split('_') + ['experiment'])
    cls = [e for e in EXPERIMENTS if e.__name__.lower() == name][0]
    return cls()

@app.route("/")
def index():
    return render_template('index.html', experiments=[
        {
            'url': '_'.join([s.lower() for s in e.name_parts()]),
            'name': ' '.join(e.name_parts())
        }
        for e in EXPERIMENTS
    ])

@app.route('/generate_experiment')
def generate_experiment():
    experiment_name = request.args.get('experiment')
    N_trials = int(request.args.get('n_trials'))
    experiment = get_experiment(experiment_name)
    return jsonify(experiment.generate_experiment(N_trials=N_trials))

@app.route('/record_results', methods=['POST'])
def record_results():
    data = request.get_json()
    experiment = get_experiment(data['experiment'])
    # TODO: get participant name, then save results somewhere
    return ''
