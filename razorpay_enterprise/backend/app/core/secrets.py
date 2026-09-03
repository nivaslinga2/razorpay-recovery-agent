import os
import json

class SecretsManager:
    def __init__(self):
        self.use_local = os.getenv("ENV", "local") == "local"
        self.region = os.getenv("AWS_REGION", "us-east-1")

    def get_secret(self, secret_name: str, default: str = None) -> str:
        if self.use_local or os.getenv("USE_AWS_SECRETS", "false").lower() != "true":
            return os.getenv(secret_name, default)
        
        # AWS Secrets Manager (Production)
        try:
            import boto3
            session = boto3.session.Session()
            client = session.client(
                service_name='secretsmanager',
                region_name=self.region
            )
            response = client.get_secret_value(SecretId=secret_name)
            if 'SecretString' in response:
                secret_dict = json.loads(response['SecretString'])
                return secret_dict.get(secret_name, default)
            return default
        except Exception as e:
            return os.getenv(secret_name, default)

secrets = SecretsManager()
