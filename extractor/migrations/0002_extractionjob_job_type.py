from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('extractor', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='extractionjob',
            name='job_type',
            field=models.CharField(default='pipeline', max_length=16),
        ),
    ]
