import threading
from psycopg2 import connect
from psycopg2.extensions import connection as Connection

thread_local = threading.local()

DB_PARAMS = {
    "dbname": "planner4students",
    "user": "postgres",
    "password": "dinozaur123",
    "host": "localhost",
    "port": "5432"
}

def get_connection() -> Connection:
    if not hasattr(thread_local, 'connection'):
        thread_local.connection = connect(**DB_PARAMS)
    return thread_local.connection
