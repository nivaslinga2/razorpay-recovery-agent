from locust import HttpUser, task, between
import random

class RecoveryUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def check_health(self):
        self.client.get("/health")

    @task(2)
    def get_metrics(self):
        self.client.get("/metrics")

    @task(1)
    def recover_payment(self):
        txn_id = f"locust_txn_{random.randint(1000, 9999)}"
        self.client.post("/api/recover", json={
            "transaction_id": txn_id,
            "amount": random.randint(500, 50000),
            "email": "loadtest@example.com"
        }, headers={"Content-Type": "application/json"})
