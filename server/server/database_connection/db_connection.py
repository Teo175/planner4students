import threading
from psycopg2 import connect
from psycopg2.extensions import connection as Connection

# Thread-local storage for database connections
thread_local = threading.local()

# Define your database connection parameters
DB_PARAMS = {
    "dbname": "planner4students",
    "user": "postgres",
    "password": "dinozaur123",
    "host": "localhost",
    "port": "5432"
}

def get_connection() -> Connection:
    """
    Function to get a connection to the PostgreSQL database
    :return: psycopg2.extensions.connection
    """
    if not hasattr(thread_local, 'connection'):
        # Create and store a connection in the thread-local storage
        thread_local.connection = connect(**DB_PARAMS)
    return thread_local.connection
