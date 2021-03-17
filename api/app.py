"""
TODO:
- convert model columns to Enum where applicable
- convert reply_* to object, `return reply.success()`
- split blueprints for issues, activity, auth
- use flask.cli.AppGroup for db subcommands
"""
import os, sys, json, time, datetime, logging
from enum import Enum
from itertools import chain

from tabulate import tabulate
import click
from flask.cli import FlaskGroup, pass_script_info
from flask import (
    Flask,
    Blueprint,
    current_app,
    request,
    jsonify,
    make_response,
)
from flask_restful import Api, Resource
from werkzeug.datastructures import Headers
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm.exc import NoResultFound
from flask_cors import CORS
from marshmallow import ValidationError, fields, validates, pre_load, post_load, EXCLUDE
from flask_marshmallow import Marshmallow

log = logging.getLogger(__name__)

ENV_VAR_KEY = "FLASK_ENV"
ENV_VAR_VAL = "development"
os.environ.setdefault(ENV_VAR_KEY, ENV_VAR_VAL)


class BaseConfig:
    ENV = None
    TESTING = False
    DEBUG = True
    LOG_FILE = None
    LOG_LEVEL = "INFO"
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TS_ISSUE_NUMBER_PADDING = 4
    TS_TIMER_HEADER_START = "X-TIME-RECEIVED"
    TS_TIMER_HEADER_STOP = "X-TIME-COMPLETED"


class TestingConfig(BaseConfig):
    ENV = "testing"
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class DevelopmentConfig(BaseConfig):
    ENV = "development"
    DEBUG = False


class DockerConfig(BaseConfig):
    ENV = "docker"
    DEBUG = False
    # dialect+driver://username:password@host:port/database
    SQLALCHEMY_DATABASE_URI = f"postgresql://postgres:postgres@localhost:5432"


class ProductionConfig(BaseConfig):
    ENV = "production"


def create_app(script_info):
    """
    Application Factory
    """

    def configure_app(app, script_info):
        """
        In order of precedence:
        - Command-line argument
        - Environment variable
        - Default setting
        """
        options = {
            "development": DevelopmentConfig,
            "testing": TestingConfig,
            "docker": DockerConfig,
            "production": ProductionConfig,
        }
        if hasattr(script_info, "configuration"):
            src = "cli"
            env = script_info.configuration
        elif os.getenv(ENV_VAR_KEY, ENV_VAR_VAL):
            src = "env"
            env = os.getenv(ENV_VAR_KEY, ENV_VAR_VAL)

        if env not in options:
            raise RuntimeError(
                f"Invalid configuration environment setting: {env} ({src})"
            )
        config = options[env]
        app.config.from_object(config)
        return app

    def configure_logging(app):
        """
        Global logging configuration. Access in other modules using
        >>> import logging
        >>> log = logging.getLogger(__name__)
        """
        log_file = app.config.get("LOG_FILE", None)
        log_level = app.config.get("LOG_LEVEL", "INFO")

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(funcName)s:%(lineno)s - %(levelname)s - %(message)s"
        )
        handlers = []
        if log_file:
            file_handler = logging.FileHandler(filename=log_file, mode="a")
            file_handler.setFormatter(formatter)
            handlers.append(file_handler)
        stream_handler = logging.StreamHandler(stream=sys.stdout)
        stream_handler.setFormatter(formatter)
        handlers.append(stream_handler)
        logging.basicConfig(
            datefmt="%m/%d/%Y %I:%M:%S %p", level=log_level, handlers=handlers
        )
        for _module, _level in app.config.get("LOGGING_OVERRIDES", {}).items():
            log.debug(f"Overriding module logging: {_module} --> {_level}")
            logging.getLogger(_module).setLevel(_level)
        return app

    app = Flask(__name__)
    configure_app(app, script_info)
    configure_logging(app)
    app.url_map.strict_slashes = False
    # init_app
    CORS(app)
    # import db, ma
    db.init_app(app)
    ma.init_app(app)
    # calling 'api.init_app(app)' is not required
    app.register_blueprint(bp, url_prefix="/api")

    ## OVERHEAD
    @app.errorhandler(Exception)
    def handle_exception(e):
        return reply_error(message=str(e))

    @app.before_request
    def before_request():
        # this timestamp is read before returning the response and
        # allows us to track how long the request was processed for.
        # NOTE: this may remove immutability in subsequent handling
        headers = Headers(
            [(app.config["TS_TIMER_HEADER_START"], make_time()), *request.headers]
        )
        request.headers = headers

    return app


## INSTANCES
bp = Blueprint("api", __name__)
# api = Api(bp); api.add_resource(<class>, <route>)
db = SQLAlchemy()
ma = Marshmallow()


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
    next_id = str(last_id + 1).zfill(current_app.config["TS_ISSUE_NUMBER_PADDING"])
    return f"{issue_project}-{next_id}"


def _base_reply(
    data=None,
    message=None,
    status=None,
    response=None,
    timestamp=make_time(),
):
    with current_app.app_context() as ctx:
        now = make_time()
        request.headers[ctx.app.config["TS_TIMER_HEADER_STOP"]] = now
        duration = now - request.headers[ctx.app.config["TS_TIMER_HEADER_START"]]
    return make_response(
        jsonify(
            data=data,
            message=message,
            response=response,
            status=status,
            timestamp=timestamp,
            duration=duration,
        ),
        response,
    )


def reply_success(data=None, message=None):
    return _base_reply(data, message, status="success", response=200)


def reply_error(data=None, message=None):
    return _base_reply(data, message, status="error", response=500)


def reply_missing(data=None, message=None):
    return _base_reply(data, message, status="missing", response=404)


## ENUMS
class IssueTypeEnum(Enum):
    UNKNOWN = 0
    BUG = 1
    TASK = 2
    FEATURE = 3
    REQUIREMENT = 4
    SUPPORT = 5
    EPIC = 6


class IssueStatusEnum(Enum):
    UNKNOWN = 0
    OPEN = 1
    ASSIGNED = 2
    IN_PROGRESS = 3
    ON_HOLD = 4
    UNDER_REVIEW = 5
    DONE = 6
    RELEASED = 7


class IssueResolutionEnum(Enum):
    UNKNOWN = 0
    UNRESOLVED = 1
    INVALID = 2
    WONT_FIX = 3
    OVERCOME_BY_EVENTS = 4
    UNABLE_TO_REPLICATE = 5
    DUPLICATE = 6
    COMPLETE = 7


## MODELS
class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer(), primary_key=True, unique=True)
    created_by = db.Column(db.String(), nullable=False)
    created_at = db.Column(db.BigInteger(), default=make_time, nullable=False)
    updated_at = db.Column(
        db.BigInteger(), default=None, onupdate=make_time, nullable=True
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
@bp.route("/issues", methods=["GET"])
def issues_route():
    # TODO: validate params
    params = dict(request.args)
    query = db.session.query(IssueModel)
    if params:
        query = query.filter_by(**params)
    result = query.all()
    return reply_success(data=IssueSchema(many=True).dump(result))


@bp.route("/issues/<string:issue_name>", methods=["GET"])
def issue_route(issue_name):
    try:
        result = db.session.query(IssueModel).filter_by(issue_name=issue_name).one()
        return reply_success(data=IssueSchema().dump(result))
    except NoResultFound as exc:
        return reply_missing(message=f"Invalid issue name: {issue_name}")


@bp.route("/activity", methods=["GET", "POST"])
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


@bp.route("/metrics", methods=["GET"])
def metrics_route():
    # TODO: parameterize this, add additional routes
    all_issue_type = list(
        chain(*db.session.query(IssueModel.issue_type.distinct()).all())
    )
    all_issue_status = list(
        chain(*db.session.query(IssueModel.issue_status.distinct()).all())
    )
    all_issue_resolution = list(
        chain(*db.session.query(IssueModel.issue_resolution.distinct()).all())
    )
    response = dict(issue_type={}, issue_status={}, issue_resolution={})
    for issue_type in all_issue_type:
        response["issue_type"][issue_type] = (
            db.session.query(IssueModel).filter_by(issue_type=issue_type).count()
        )
    for issue_status in all_issue_status:
        response["issue_status"][issue_status] = (
            db.session.query(IssueModel).filter_by(issue_status=issue_status).count()
        )
    for issue_resolution in all_issue_resolution:
        response["issue_resolution"][issue_resolution] = (
            db.session.query(IssueModel)
            .filter_by(issue_resolution=issue_resolution)
            .count()
        )
    return reply_success(data=response)


## CLI
@click.group(cls=FlaskGroup, create_app=create_app)
@click.option("-c", "--configuration", default="development")
@pass_script_info
def cli(script_info, configuration):
    """This is the management script for the application"""
    script_info.configuration = configuration


@cli.command("settings")
def cli_settings():
    """Show environment configuration settings."""
    print(tabulate(list(current_app.config.items()), headers=["Parameter", "Setting"]))


@cli.command("db_create")
def cli_db_create():
    log.info("Creating database...")
    db.create_all()
    db.session.commit()
    log.info("OK")


@cli.command("db_drop")
def cli_db_create():
    log.info("Dropping database...")
    db.drop_all()
    db.create_all()
    db.session.commit()
    log.info("OK")


@cli.command("db_seed")
def cli_db_seed():
    log.info("Seeding database...")
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
    log.info("OK")


## DRIVER
if __name__ == "__main__":
    cli()
