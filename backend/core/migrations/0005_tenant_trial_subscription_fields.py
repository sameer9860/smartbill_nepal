# Generated manually for trial & subscription fields

import django.utils.timezone
from django.db import migrations, models

import core.models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_alter_invoice_invoice_number_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='trial_starts_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='tenant',
            name='trial_ends_at',
            field=models.DateTimeField(default=core.models.default_trial_ends_at),
        ),
        migrations.AddField(
            model_name='tenant',
            name='subscription_plan',
            field=models.CharField(
                choices=[
                    ('TRIAL', 'Free Trial'),
                    ('BASIC_MONTHLY', 'Basic Monthly'),
                    ('PRO_YEARLY', 'Pro Yearly'),
                    ('ENTERPRISE', 'Enterprise'),
                ],
                default='TRIAL',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='tenant',
            name='subscription_status',
            field=models.CharField(
                choices=[
                    ('TRIAL_ACTIVE', 'Trial Active'),
                    ('ACTIVE', 'Active'),
                    ('EXPIRED', 'Expired'),
                    ('CANCELLED', 'Cancelled'),
                ],
                default='TRIAL_ACTIVE',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='tenant',
            name='subscription_ends_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
