from django.test import TestCase
from .models import Feedback


class FeedbackModelTest(TestCase):
    def test_create_feedback(self):
        msg = Feedback.objects.create(
            username='Alice',
            email='alice@example.com',
            message='Hello',
        )
        self.assertEqual(Feedback.objects.count(), 1)
        self.assertEqual(msg.username, 'Alice')
        self.assertIsNotNone(msg.created_at)


class MessagesViewTest(TestCase):
    def test_get_returns_200(self):
        response = self.client.get('/messages/')
        self.assertEqual(response.status_code, 200)

    def test_empty_state_message(self):
        response = self.client.get('/messages/')
        self.assertContains(response, 'Поки що повідомлень немає.')

    def test_shows_feedback_entries(self):
        Feedback.objects.create(username='Bob', email='b@b.com', message='Hi there')
        response = self.client.get('/messages/')
        self.assertContains(response, 'Bob')
        self.assertContains(response, 'Hi there')


class IndexViewTest(TestCase):
    def test_get_returns_200(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_contains_page_title(self):
        response = self.client.get('/')
        self.assertContains(response, 'BLAST і пошук гомологів')


class SubmitViewTest(TestCase):
    def test_valid_submission(self):
        response = self.client.post('/submit/', {
            'name': 'Alice', 'email': 'alice@example.com', 'message': 'Hello'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('Alice', data['message'])
        self.assertEqual(Feedback.objects.count(), 1)

    def test_missing_fields(self):
        response = self.client.post('/submit/', {'name': 'Alice'})
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.json()['success'])

    def test_invalid_email(self):
        response = self.client.post('/submit/', {
            'name': 'Alice', 'email': 'not-an-email', 'message': 'Hi'
        })
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.json()['success'])

    def test_get_not_allowed(self):
        response = self.client.get('/submit/')
        self.assertEqual(response.status_code, 405)


class DeleteViewTest(TestCase):
    def test_delete_existing_message(self):
        msg = Feedback.objects.create(username='Bob', email='b@b.com', message='Hey')
        response = self.client.post('/delete/', {'id': msg.id})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(Feedback.objects.count(), 0)

    def test_delete_nonexistent_message(self):
        response = self.client.post('/delete/', {'id': 999})
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.json()['success'])

    def test_delete_invalid_id(self):
        response = self.client.post('/delete/', {'id': 'abc'})
        self.assertEqual(response.status_code, 422)
        self.assertFalse(response.json()['success'])

    def test_delete_get_not_allowed(self):
        response = self.client.get('/delete/')
        self.assertEqual(response.status_code, 405)
