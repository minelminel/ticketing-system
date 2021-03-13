"""
TODO:
- convert model columns to Enum where applicable
- add configs: local,docker,test,production
- create blueprints for issues,activity,auth
"""
import os, json, datetime
from flask import (
    Flask,
    Blueprint,
    current_app,
    request,
    jsonify,
    render_template,
    url_for,
    make_response,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm.exc import NoResultFound
from flask_cors import CORS
from marshmallow import ValidationError, fields, validates, pre_load, post_load, EXCLUDE
from flask_marshmallow import Marshmallow

config = {
    "SQLALCHEMY_DATABASE_URI": "sqlite:///database.db",
    "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    "FLASK_ENVIRONMENT": os.getenv("FLASK_ENVIRONMENT", "local"),
    "TS_ISSUE_NUMBER_PADDING": 4,
}

app = Flask(__name__)
app.config.update(config)
app.url_map.strict_slashes = False
CORS(app)
db = SQLAlchemy(app)
ma = Marshmallow(app)

## OVERHEAD
@app.errorhandler(Exception)
def handle_exception(e):
    return reply_error(message=str(e))


## UTILS
def make_time():
    return int(datetime.datetime.now().timestamp() * 1000)


def create_issue_name(issue_project):
    record = IssueSchema().dump(
        db.session.query(IssueModel)
        .filter_by(issue_project=issue_project)
        .order_by(IssueModel.id.desc())
        .first()
    )
    last_id = record.get("id", 0)
    next_id = str(last_id + 1).zfill(app.config["TS_ISSUE_NUMBER_PADDING"])
    return f"{issue_project}-{next_id}"


def _base_reply(
    data=None, message=None, status=None, response=None, timestamp=make_time()
):
    return make_response(
        jsonify(
            data=data,
            message=message,
            response=response,
            status=status,
            timestamp=timestamp,
        ),
        response,
    )


def reply_success(data=None, message=None):
    return _base_reply(data, message, status="success", response=200)


def reply_error(data=None, message=None):
    return _base_reply(data, message, status="error", response=500)


def reply_missing(data=None, message=None):
    return _base_reply(data, message, status="missing", response=404)


## MODELS
class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer(), primary_key=True, unique=True)
    created_by = db.Column(db.String(), nullable=False)
    created_at = db.Column(db.Integer(), default=make_time, nullable=False)
    updated_at = db.Column(
        db.Integer(), default=None, onupdate=make_time, nullable=True
    )


class ActivityModel(BaseModel):
    __tablename__ = "activity"
    # __table__args__ = (db.ForeignKeyConstraint(["issue_id"], ["issues.id"]))

    issue_id = db.Column(db.Integer(), db.ForeignKey("issues.id"), nullable=False)
    activity_type = db.Column(db.String(), nullable=False)
    activity_text = db.Column(db.String(), nullable=True)


class IssueModel(BaseModel):
    __tablename__ = "issues"

    issue_project = db.Column(db.String(), nullable=False)
    issue_name = db.Column(db.String(), nullable=False)
    issue_type = db.Column(db.String(), nullable=False)
    issue_priority = db.Column(db.Integer(), nullable=False)
    issue_story_points = db.Column(db.Integer(), nullable=False)
    issue_summary = db.Column(db.String(), nullable=False)
    issue_description = db.Column(db.String(), nullable=True)
    issue_status = db.Column(db.String(), nullable=False)
    issue_resolution = db.Column(db.String(), nullable=True)
    issue_affected_version = db.Column(db.String(), nullable=True)
    issue_fixed_version = db.Column(db.String(), nullable=True)
    issue_assigned_to = db.Column(db.String(), nullable=True)
    activity = db.relationship("ActivityModel", backref="issues")


class BaseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        """Alternate method of configuration which eliminates the need to
        subclass BaseSchema.Meta

        https://marshmallow-sqlalchemy.readthedocs.io/en/latest/recipes.html#base-schema-ii
        """

        sqla_session = db.session
        load_instance = True
        transient = True
        unknown = EXCLUDE

    @pre_load
    def set_nested_session(self, data, **kwargs):
        """Allow nested schemas to use the parent schema's session. This is a
        longstanding bug with marshmallow-sqlalchemy.

        https://github.com/marshmallow-code/marshmallow-sqlalchemy/issues/67
        https://github.com/marshmallow-code/marshmallow/issues/658#issuecomment-328369199
        """
        nested_fields = {
            k: v for k, v in self.fields.items() if type(v) == fields.Nested
        }
        for field in nested_fields.values():
            field.schema.session = self.session
        return data


class ActivitySchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = ActivityModel

    issue_id = fields.Int(required=True)
    issues = fields.Int(load_only=True)  # not sure about this..
    activity_type = fields.Str(required=True)
    activity_text = fields.Str(required=False)

    @validates("activity_type")
    def validate_activity_type(self, data, **kwargs):
        choices = ("comment", "assignment", "status", "resolution")
        if data not in choices:
            raise ValidationError(f"Invalid activity type: {data}, must be {choices}")

    @validates("issue_id")
    def validate_issue_id(self, data, **kwargs):
        # TODO: figure out how to do this with table constraints
        try:
            db.session.query(IssueModel).filter_by(id=data).one()
        except NoResultFound:
            raise ValidationError(f"Invalid issue id: {data}")

    @post_load
    def post_load(self, data, **kwargs):
        # TODO: generate activity_text for non-comment updates
        return data


class IssueSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = IssueModel

    id = fields.Int(dump_only=True)
    created_at = fields.Int(dump_only=True)
    updated_at = fields.Int(dump_only=True)
    created_by = fields.Str(required=True, allow_none=False)
    issue_project = fields.Str(required=True)
    issue_name = fields.Str(dump_only=True)
    issue_type = fields.Str(required=True)
    issue_priority = fields.Int(required=True)
    issue_story_points = fields.Int(required=True)
    issue_summary = fields.Str(required=True)
    issue_description = fields.Str(required=False, allow_none=True)
    issue_status = fields.Str(required=False, missing="open", default="open")
    issue_resolution = fields.Str(
        required=False, missing="unresolved", default="unresolved"
    )
    issue_fixed_version = fields.Str(required=False, allow_none=True)
    issue_assigned_to = fields.Str(required=False, allow_none=True)
    # one-to-many
    activity = fields.Nested(ActivitySchema, many=True)

    @validates("issue_resolution")
    def validate_issue_resolution(self, data, **kwargs):
        choices = (
            "unresolved",
            "invalid",
            "wont_fix",
            "overcome_by_events",
            "unable_to_replicate",
            "duplicate",
            "complete",
        )
        if data not in choices:
            raise ValidationError(
                f"Invalid issue resolution: {data}, must be {choices}"
            )

    @validates("issue_status")
    def validate_issue_status(self, data, **kwargs):
        choices = (
            "open",
            "assigned",
            "in_progress",
            "on_hold",
            "under_review",
            "done",
            "released",
        )
        if data not in choices:
            raise ValidationError(f"Invalid issue status: {data}, must be {choices}")

    @validates("issue_story_points")
    def validate_issue_story_points(self, data, **kwargs):
        if data < 1:
            raise ValidationError(
                f"Invalid issue story points: {data}, must be greater than 1"
            )

    @validates("issue_priority")
    def validate_issue_priority(self, data, **kwargs):
        min_pri = 1
        max_pri = 5
        if data not in range(min_pri, max_pri + 1):
            raise ValidationError(
                f"Invalid issue priority: {data}, must be between {min_pri} and {max_pri}"
            )

    @validates("issue_type")
    def validate_issue_type(self, data, **kwargs):
        choices = ("bug", "task", "feature", "requirement", "support", "epic")
        if data not in choices:
            raise ValidationError(f"Invalid issue type: {data}, must be {choices}")

    @post_load
    def post_load(self, data, **kwargs):
        data.issue_name = create_issue_name(data.issue_project)
        return data


## ROUTES
@app.route("/api/issues", methods=["GET"])
def issues_route():
    # TODO: validate params
    params = dict(request.args)
    query = db.session.query(IssueModel)
    if params:
        query = query.filter_by(**params)
    result = query.all()
    return reply_success(data=IssueSchema(many=True).dump(result))


@app.route("/api/issues/<string:issue_name>", methods=["GET"])
def issue_route(issue_name):
    try:
        result = db.session.query(IssueModel).filter_by(issue_name=issue_name).one()
        return reply_success(data=IssueSchema().dump(result))
    except NoResultFound as exc:
        return reply_missing(message=f"Invalid issue name: {issue_name}")


@app.route("/api/activity", methods=["GET", "POST"])
def activity_route():
    if request.method == "GET":
        # TODO: validate params
        params = dict(request.args)
        query = db.session.query(ActivityModel)
        if params:
            query = query.filter_by(**params)
        result = query.all()
        return reply_success(data=ActivitySchema(many=True).dump(result))
    elif request.method == "POST":
        obj = ActivitySchema().load(request.get_json())
        db.session.add(obj)
        db.session.commit()
        return reply_success(ActivitySchema().dump(obj))


## DRIVER
if __name__ == "__main__":
    db.drop_all()
    db.create_all()
    # mock db hydration
    with open("./data/issues.json", "r") as file:
        issues = json.load(file)
    for each in issues:
        db.session.add(IssueSchema().load(each))
        db.session.commit()
    with open("./data/activity.json", "r") as file:
        activity = json.load(file)
    for each in activity:
        db.session.add(ActivitySchema().load(each))
        db.session.commit()
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=True)
