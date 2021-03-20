"""
TODO:
- convert Enum columns to Int on load, Str on dump
- split blueprints for issues, activity, auth
- use flask.cli.AppGroup for db subcommands
- use foreign key for user fields rather than static string
- add backrefs to db entries to delete foreign relations
"""
import os, sys, json, time, secrets, datetime, logging, traceback
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
    g,
)
from flask_httpauth import HTTPBasicAuth
from itsdangerous import (
    TimedJSONWebSignatureSerializer as Serializer,
    BadSignature,
    SignatureExpired,
)
from flask_restful import Api, Resource
from werkzeug.datastructures import Headers
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm.exc import NoResultFound
from flask_cors import CORS
from marshmallow import (
    ValidationError,
    fields,
    validates,
    validate,
    pre_load,
    post_load,
    EXCLUDE,
)
from flask_marshmallow import Marshmallow
from passlib.apps import custom_app_context as password_context

log = logging.getLogger(__name__)
here = os.path.dirname(os.path.abspath(__file__))

ENV_VAR_KEY = "FLASK_ENV"
ENV_VAR_VAL = "development"
os.environ.setdefault(ENV_VAR_KEY, ENV_VAR_VAL)


class BaseConfig:
    ENV = None
    TESTING = False
    DEBUG = False
    LOG_FILE = None
    LOG_LEVEL = "INFO"
    THROTTLE_MS = 0
    SECRET_KEY = "begaydocrime"
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TS_ISSUE_NUMBER_PADDING = 4
    TS_TIMER_HEADER_START = "X-TIME-RECEIVED"
    TS_TIMER_HEADER_STOP = "X-TIME-COMPLETED"


class TestingConfig(BaseConfig):
    ENV = "testing"
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class DevelopmentConfig(BaseConfig):
    ENV = "development"
    DEBUG = True
    THROTTLE_MS = 100


class DockerConfig(BaseConfig):
    ENV = "docker"
    # dialect+driver://username:password@host:port/database
    SQLALCHEMY_DATABASE_URI = f"postgresql://postgres:postgres@db:5432"


class ProductionConfig(BaseConfig):
    ENV = "production"
    SECRET_KEY = secrets.token_hex(16)


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
        if hasattr(script_info, "configuration") and script_info.configuration:
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
        app.config.update(dict(CONFIG_SOURCE=src))
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
    # import db, ma, auth
    db.init_app(app)
    ma.init_app(app)
    # calling 'api.init_app(app)' is not required
    app.register_blueprint(bp, url_prefix="/api")

    ## HANDLERS
    @auth.error_handler
    def handle_auth_error(e):
        log.error(e)
        return Reply.unauthorized(message="Invalid or expired credentials")

    @app.errorhandler(404)
    def handle_not_found(e):
        return Reply.missing(message=str(e))

    @app.errorhandler(ValidationError)
    def handle_validationerror(e):
        log.error(e)
        log.error(traceback.print_exc())
        return Reply.error(message=str(e))

    @app.errorhandler(Exception)
    def handle_exception(e):
        log.error(e)
        log.error(traceback.print_exc())
        return Reply.exception(message=str(e))

    @app.before_request
    def before_request():
        """
        this timestamp is read before returning the response and
        allows us to track how long the request was processed for.
        NOTE: this may remove immutability in subsequent handling
        """
        headers = Headers(
            [(app.config["TS_TIMER_HEADER_START"], make_time()), *request.headers]
        )
        request.headers = headers
        # If throttling is enabled, add MS deadlock to each request.
        if app.config.get("THROTTLE_MS", 0):
            time.sleep(app.config["THROTTLE_MS"] / 1000)

    return app


## INSTANCES
bp = Blueprint("api", __name__)
# api = Api(bp); api.add_resource(<class>, <route>)
db = SQLAlchemy()
ma = Marshmallow()
auth = HTTPBasicAuth()

## UTILS
@auth.verify_password
def verify_password(username_or_token, password):
    """
    Decorate protected routes using @auth.verify_password
    """
    log.info(f"Trying token authentication: {username_or_token}")
    user = UserModel.verify_auth_token(username_or_token)
    if not user:
        log.info(
            f"Token authentication failed, trying username/password: {username_or_token}"
        )
        user = db.session.query(UserModel).filter_by(username=username_or_token).first()
        if not user or not user.verify_password(password):
            log.info("Username/password authentication failed, denying access")
            return False
    log.info(f"Authentication succeeded, granting access: username={user.username}")
    g.user = user
    return True


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


class Reply(object):
    """
    Static class for reply namespace.
    """

    @staticmethod
    def get_duration():
        with current_app.app_context() as ctx:
            now = make_time()
            request.headers[ctx.app.config["TS_TIMER_HEADER_STOP"]] = now
            return now - request.headers[ctx.app.config["TS_TIMER_HEADER_START"]]

    @classmethod
    def _base_reply(
        cls, data=None, message=None, status=None, response=None, timestamp=make_time()
    ):
        return make_response(
            jsonify(
                data=data,
                message=message,
                response=response,
                status=status,
                timestamp=timestamp,
                duration=cls.get_duration(),
            ),
            response,
        )

    @classmethod
    def success(cls, data=None, message=None):
        return cls._base_reply(
            data=data, message=message, status="success", response=200
        )

    @classmethod
    def error(cls, data=None, message=None):
        return cls._base_reply(data=data, message=message, status="error", response=400)

    @classmethod
    def exception(cls, data=None, message=None):
        return cls._base_reply(
            data=data, message=message, status="exception", response=500
        )

    @classmethod
    def missing(cls, data=None, message=None):
        return cls._base_reply(
            data=data, message=message, status="missing", response=404
        )

    @classmethod
    def unauthorized(cls, data=None, message=None):
        return cls._base_reply(
            data=data, message=message, status="unauthorized", response=401
        )


## ENUMS: raise ValueError on (), AttributeError on .
class ExtendedEnum(Enum):
    """
    MyEnum(0)
        -> raises ValueError if invalid
    MyEnum["KEY"], MyEnum.KEY
        -> raises AttributeError if invalid
    """

    @classmethod
    def names(cls):
        return list(map(lambda e: e.name, cls))

    @classmethod
    def values(cls):
        return list(map(lambda e: e.value, cls))

    @classmethod
    def items(cls):
        return list(map(lambda e: (e.name, e.value), cls))


class IssueTypeEnum(ExtendedEnum):
    UNKNOWN = 0
    BUG = 1
    TASK = 2
    FEATURE = 3
    REQUIREMENT = 4
    SUPPORT = 5
    EPIC = 6


class IssueStatusEnum(ExtendedEnum):
    UNKNOWN = 0
    OPEN = 1
    ASSIGNED = 2
    IN_PROGRESS = 3
    ON_HOLD = 4
    UNDER_REVIEW = 5
    DONE = 6
    RELEASED = 7


class IssueResolutionEnum(ExtendedEnum):
    UNKNOWN = 0
    UNRESOLVED = 1
    INVALID = 2
    WONT_FIX = 3
    OVERCOME_BY_EVENTS = 4
    UNABLE_TO_REPLICATE = 5
    DUPLICATE = 6
    COMPLETE = 7


class ActivityTypeEnum(ExtendedEnum):
    UNKNOWN = 0
    COMMENT = 1
    UPDATE = 2
    # ASSIGNMENT = 2
    # STATUS = 3
    # RESOLUTION = 4


## MODELS
class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer(), primary_key=True, unique=True)
    created_at = db.Column(db.BigInteger(), default=make_time, nullable=False)
    updated_at = db.Column(
        db.BigInteger(), default=None, onupdate=make_time, nullable=True
    )


class UserModel(BaseModel):
    __tablename__ = "users"

    username = db.Column(db.String(32), index=True)
    password = db.Column(db.String(128))

    def hash_password(self, password):
        print(f"Hashing Password: {password}")
        self.password = password_context.encrypt(password)

    def verify_password(self, password):
        return password_context.verify(password, self.password)

    def generate_auth_token(self, expiration=600):
        s = Serializer(current_app.config["SECRET_KEY"], expires_in=expiration)
        return s.dumps(dict(id=self.id))

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(current_app.config["SECRET_KEY"])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None  # valid token, but expired
        except BadSignature:
            return None  # invalid token
        user = db.session.query(UserModel).filter_by(id=data["id"]).first()
        return user


class ActivityModel(BaseModel):
    __tablename__ = "activity"
    # __table__args__ = (db.ForeignKeyConstraint(["issue_id"], ["issues.id"]))
    created_by = db.Column(db.String(), nullable=False)
    issue_id = db.Column(db.Integer(), db.ForeignKey("issues.id"), nullable=False)
    activity_type = db.Column(db.String(), nullable=False)
    activity_text = db.Column(db.String(), nullable=True)


class IssueModel(BaseModel):
    __tablename__ = "issues"

    created_by = db.Column(db.String(), nullable=False)
    issue_project = db.Column(db.String(), nullable=False)
    issue_name = db.Column(db.String(), nullable=False)
    issue_type = db.Column(db.String(), nullable=False)
    issue_priority = db.Column(db.Integer(), nullable=False)
    issue_story_points = db.Column(db.Integer(), nullable=False)
    issue_summary = db.Column(db.String(), nullable=False)
    issue_description = db.Column(db.String(), nullable=True)
    issue_status = db.Column(db.String(), nullable=False)
    issue_resolution = db.Column(db.String(), nullable=False)
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


class UserSchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = UserModel

    id = fields.Int(dump_only=True)
    created_at = fields.Int(dump_only=True)
    updated_at = fields.Int(dump_only=True)
    username = fields.Str(
        required=True, allow_none=False, validate=validate.Length(max=32)
    )
    password = fields.Str(
        required=True, allow_none=False, validate=validate.Length(max=128)
    )


class ActivitySchema(BaseSchema):
    class Meta(BaseSchema.Meta):
        model = ActivityModel

    id = fields.Int(dump_only=True)
    created_at = fields.Int(dump_only=True)
    updated_at = fields.Int(dump_only=True)
    created_by = fields.Str(required=True, allow_none=False)
    issue_id = fields.Int(required=True)
    issues = fields.Int(load_only=True)  # not sure about this..
    activity_type = fields.Str(
        required=True, validate=validate.OneOf(ActivityTypeEnum.names())
    )
    activity_text = fields.Str(required=False)

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
    issue_type = fields.Str(
        required=True, validate=validate.OneOf(IssueTypeEnum.names())
    )
    issue_priority = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    issue_story_points = fields.Int(required=True, validate=validate.Range(min=1))
    issue_summary = fields.Str(required=True)
    issue_description = fields.Str(required=False, allow_none=True)
    issue_status = fields.Str(
        required=False,
        default=IssueStatusEnum.OPEN,
        validate=validate.OneOf(IssueStatusEnum.names()),
    )
    issue_resolution = fields.Str(
        required=False,
        default=IssueResolutionEnum.UNRESOLVED,
        validate=validate.OneOf(IssueResolutionEnum.names()),
    )
    issue_fixed_version = fields.Str(required=False, allow_none=True)
    issue_assigned_to = fields.Str(required=False, allow_none=True)
    # one-to-many
    activity = fields.Nested(ActivitySchema, many=True)

    @post_load
    def post_load(self, data, **kwargs):
        data.issue_name = create_issue_name(data.issue_project)
        return data


## ROUTES
@bp.route("/issues", methods=["GET", "POST"])
def issues_route():
    if request.method == "GET":
        # TODO: implement pagination
        # TODO: validate params
        params = dict(request.args)
        query = db.session.query(IssueModel)
        if params:
            query = query.filter_by(**params)
        result = query.all()
        return Reply.success(data=IssueSchema(many=True).dump(result))
    elif request.method == "POST":
        obj = IssueSchema().load(request.get_json())
        db.session.add(obj)
        db.session.commit()
        return Reply.success(IssueSchema().dump(obj))


@bp.route("/issues/<string:issue_name>", methods=["GET", "PUT"])
def issue_route(issue_name):
    if request.method == "GET":
        try:
            result = db.session.query(IssueModel).filter_by(issue_name=issue_name).one()
            return Reply.success(data=IssueSchema().dump(result))
        except NoResultFound as exc:
            return Reply.missing(message=f"Invalid issue name: {issue_name}")
    # Updates are made by sending the entire updated object,
    # and a diff is performed on the editable keys which leads
    # to the creation of 'update' activity entries.
    # The entire updated object is then returned.

    # IMPORTANT: there is no currently implemented way of getting the
    # username of the person updating the entry. For now it is hardcoded
    # in order to satisfy the schema constraints, in the future this will
    # come from the JWT/Session in some form based on who is logged in.
    elif request.method == "PUT":
        USER_NAME = "hardcoded@example.com"
        editable = [
            "issue_affected_version",
            "issue_assigned_to",
            "issue_description",
            "issue_fixed_version",
            "issue_priority",
            "issue_resolution",
            "issue_status",
            "issue_story_points",
            "issue_summary",
            "issue_type",
        ]
        # Grab the entry we are attempting to update, if it doesn't exist
        # throw a Missing error
        try:
            existing = (
                db.session.query(IssueModel).filter_by(issue_name=issue_name).one()
            )
        except NoResultFound as exc:
            return Reply.missing(message=f"Invalid issue name: {issue_name}")
        # Deserialize the incoming object, perform initial validation
        incoming = IssueSchema(only=editable).load(request.get_json())
        # Perform a diff on the list of editable keys
        changes = {}  # key: {new: new, old: old}
        for key in editable:
            old = getattr(existing, key)
            new = getattr(incoming, key)
            if old != new:
                changes.update({key: dict(old=old, new=new)})
                log.info(
                    f"Updating issue_name={issue_name} key={key} old={old} new={new}"
                )
                setattr(existing, key, new)
        if not changes:
            return Reply.success(message=f"No changes made to issue: {issue_name}")
        db.session.commit()
        # Create an Update Activity recording our changes. Wrap the text in ticks
        # such that it can be nicely displayed in Markdown.
        activity_text = tabulate(
            [(key, val["old"], val["new"]) for key, val in changes.items()],
            headers=["Setting", "From", "To"],
        )
        activity = ActivitySchema().load(
            dict(
                created_by=USER_NAME,
                issue_id=existing.id,
                activity_type=ActivityTypeEnum.UPDATE.name,
                activity_text=f"```\n{activity_text}\n```",
            )
        )
        db.session.add(activity)
        db.session.commit()
        return Reply.success(ActivitySchema().dump(activity))


@bp.route("/activity", methods=["GET", "POST"])
def activity_route():
    if request.method == "GET":
        # TODO: implement pagination
        # TODO: validate params
        params = dict(request.args)
        query = db.session.query(ActivityModel)
        if params:
            query = query.filter_by(**params)
        result = query.all()
        return Reply.success(data=ActivitySchema(many=True).dump(result))
    elif request.method == "POST":
        obj = ActivitySchema().load(request.get_json())
        db.session.add(obj)
        db.session.commit()
        return Reply.success(ActivitySchema().dump(obj))


@bp.route("/auth/register", methods=["POST"])
def auth_register_route():
    # Register new users
    # TODO: use database constraints to determine collision automatically
    username = request.get_json().get("username")
    password = request.get_json().get("password")

    if username is None or password is None:
        return Reply.error(message="Missing username and/or password")

    if db.session.query(UserModel).filter_by(username=username).first() is not None:
        return Reply.error(message="Username already exists")

    user = UserModel(username=username)
    user.hash_password(password)
    db.session.add(user)
    db.session.commit()
    log.info(f"Created new user: {username}")
    return Reply.success(message=f"Welcome aboard, {username}")


@bp.route("/auth/token", methods=["GET"])
@auth.login_required
def auth_token_route():
    """
    Grant registered users an authentication token to be used
    in subsequent requests. Any `logout` feature should be
    implemented client-side by deleting the auth token from
    the provider context.
    """
    token = g.user.generate_auth_token()
    return Reply.success(
        data=dict(username=g.user.username, token=token.decode("ascii"))
    )


@bp.route("/auth/validate", methods=["GET"])
@auth.login_required
def auth_validate_route():
    """
    Allow the user/service to validate their auth token.
    Returns a 200 (success) if valid, else 401 (unauthorized)
    Authentication logic is handled entirely by decorator.
    """
    return Reply.success()


## CLI
# `add_default_commands=False` omits: run_command, shell_command, routes_command
@click.group(cls=FlaskGroup, create_app=create_app)
@click.option(
    "-c",
    "--configuration",
    # default="development", # check envvar before providing default
    type=click.Choice(["development", "docker", "testing", "production"]),
)
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
    """Create all tables"""
    log.info("Creating database...")
    db.create_all()
    log.info("OK")


@cli.command("db_drop")
def cli_db_drop():
    """Drops all tables"""
    log.info("Dropping database...")
    db.drop_all()
    db.session.commit()
    log.info("Creating empty database...")
    db.create_all()
    log.info("OK")


@cli.command("db_seed")
def cli_db_seed():
    """Injects mock data into tables"""
    log.info("Seeding database...")
    log.info(f"Writing table: {IssueModel.__tablename__}")
    with open(os.path.join(here, "data", "issues.json"), "r") as file:
        issues = json.load(file)
    for each in issues:
        db.session.add(IssueSchema().load(each))
        db.session.commit()
    log.info(f"Writing table: {ActivityModel.__tablename__}")
    with open(os.path.join(here, "data", "activity.json"), "r") as file:
        activity = json.load(file)
    for each in activity:
        db.session.add(ActivitySchema().load(each))
        db.session.commit()
    log.info("OK")


## DRIVER
if __name__ == "__main__":
    cli()
