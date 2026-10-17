from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Applies the SQL files in database/sql (triggers, functions, procedures, views) to PostgreSQL."

    def handle(self, *args, **options):
        sql_dir = Path(settings.BASE_DIR) / 'database' / 'sql'
        for sql_file in sorted(sql_dir.glob('*.sql')):
            with connection.cursor() as cursor:
                cursor.execute(sql_file.read_text(encoding='utf-8'))
            self.stdout.write(self.style.SUCCESS(f'Applied {sql_file.name}'))
