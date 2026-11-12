import time
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.utils import OperationalError
from psycopg2 import OperationalError as Psycopg2OpError


class Command(BaseCommand):
    help = 'Wait for database to become available before starting app'

    def handle(self, *args, **options):
        self.stdout.write('Waiting for database to be ready...')
        db_up = False
        attempts = 0
        max_attempts = 45

        while not db_up and attempts < max_attempts:
            try:
                connection.ensure_connection()
                db_up = True
            except (OperationalError, Psycopg2OpError) as e:
                attempts += 1
                self.stdout.write(f'Database not ready yet ({e.args[0] if e.args else e}). Waiting 1s... ({attempts}/{max_attempts})')
                time.sleep(1)

        if db_up:
            self.stdout.write(self.style.SUCCESS('Database connection established!'))
        else:
            self.stdout.write(self.style.ERROR(f'Could not connect to database after {max_attempts} seconds.'))
            raise SystemExit(1)

