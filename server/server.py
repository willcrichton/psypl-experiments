from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from psypl.experiments import EXPERIMENTS
from bson import json_util

app = Flask(__name__)
CORS(app)
app.debug = True

app.config["MONGO_URI"] = "mongodb://moc:moc@localhost:27017/experiments?authSource=admin"

mongo = PyMongo(app)
experiments_db = mongo.db.experiments

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

@app.route('/api/generate_experiment')
def generate_experiment():
    experiment_name = request.args.get('experiment')
    experiment = get_experiment(experiment_name)
    return jsonify(experiment.generate_experiment())

@app.route('/api/record_results', methods=['POST'])
def record_results():
    data = request.get_json()
    experiment = get_experiment(data['experiment'])
    participant = data['participant']
    results = data['results']
    description = data['description']

    experiments_db.update_one(
        {'experiment_name': experiment.__class__.__name__},
        {'$push': {f'participants.{participant}.trials': description['trials'],
                   f'participants.{participant}.results': results}})

    return ''

@app.route('/api/get_results')
def get_results():
    experiment_name = request.args.get('experiment')
    experiment = get_experiment(experiment_name)
    results = experiments_db.find_one(
        {'experiment_name': experiment.__class__.__name__})

    return json_util.dumps(results)

@app.route("/api/init_db")
def initdb():
    mongo.db['experiments'].insert_many([{
        'experiment_name': exp.__name__,
        'participants': {}
    } for exp in EXPERIMENTS])
    return 'ok'
            
    
@app.route('/api/reset_db')
def resetdb():
    # for exp in EXPERIMENTS:
    #     experiments_db.update_one(
    #         {'experiment_name': exp.__name__},
    #         {'$set': {'participants': {}}})
    return 'ok'
         
