"""I-08 live HTTP checks. Run only against a disposable local test database.

Uses real admin form login/CSRF and user JWTs; never prints or reports tokens.
Set I08_STATE to a private temporary JSON path, I08_REPORT to an output JSON,
and I08_ADMIN_PASSWORD to the local test administrator password.
Commands: prepare, deactivate, reactivate, short-login, expired.
"""
import base64
import datetime as dt
import json
import os
from pathlib import Path
import sys
import time
from html.parser import HTMLParser

import requests

BASE = 'http://127.0.0.1:8080'
STATE = Path(os.environ['I08_STATE'])
REPORT = Path(os.environ['I08_REPORT'])
PASSWORD = 'I08Check123!'
records = json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else []


def save():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')


def api(label, method, path, expected, *, token=None, body=None, code=None):
    r = requests.request(method, BASE + path, json=body,
                         headers={'Authorization': 'Bearer ' + token} if token else {}, timeout=15)
    data = r.json() if r.content else {}
    actual_code = data.get('error', {}).get('code')
    passed = r.status_code == expected and (code is None or actual_code == code)
    records.append(dict(time=dt.datetime.now(dt.timezone.utc).isoformat(), label=label,
                        method=method, path=path, status=r.status_code, error_code=actual_code,
                        expected_status=expected, expected_code=code, passed=passed))
    save()
    print(label, r.status_code, actual_code or '', 'PASS' if passed else 'FAIL')
    assert passed, f'{label}: unexpected response'
    return data.get('data')


class CsrfParser(HTMLParser):
    token = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'input' and attrs.get('name') == '_csrf':
            self.token = attrs.get('value')


def csrf(response):
    response.raise_for_status()
    parser = CsrfParser()
    parser.feed(response.text)
    assert parser.token, 'No CSRF field'
    return parser.token


def admin():
    session = requests.Session()
    token = csrf(session.get(BASE + '/admin/login', timeout=15))
    r = session.post(BASE + '/admin/login', data={'email': 'admin@kdsq.com',
                    'password': os.environ['I08_ADMIN_PASSWORD'], '_csrf': token}, timeout=15)
    assert r.status_code == 200 and '/admin/dashboard' in r.url, 'Admin login failed'
    return session


def change_status(session, member, action):
    path = f"/admin/members/{member['id']}"
    token = csrf(session.get(BASE + path, timeout=15))
    r = session.post(BASE + path + '/' + action, data={'_csrf': token}, timeout=15)
    assert r.status_code == 200 and path in r.url
    records.append(dict(time=dt.datetime.now(dt.timezone.utc).isoformat(),
                        label='admin_' + action, member_id=member['id'], status=r.status_code,
                        final_path=r.url.removeprefix(BASE), passed=True))
    save()


def claims(token):
    part = token.split('.')[1]
    return json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))


def login(member, label):
    member['tokens'] = api(label, 'POST', '/api/auth/login', 200,
                           body={'email': member['email'], 'password': PASSWORD})
    c = claims(member['tokens']['accessToken'])
    member['exp'] = c['exp']
    records.append(dict(label=label + '_lifetime', lifetime_seconds=c['exp'] - c['iat'], passed=True))
    save()


def probe(member, expired=False):
    token = member['tokens']['accessToken']
    remaining = member['exp'] - time.time()
    assert remaining <= 0 if expired else remaining > 0, 'Unexpected token expiry condition'
    records.append(dict(label='token_expiry_condition', expired=expired,
                        seconds_remaining=round(remaining, 2), passed=True))
    save()
    prefix = 'expired_' if expired else 'inactive_'
    for label, method, path, body in [
        ('profile', 'GET', '/api/members/me', None),
        ('history', 'GET', '/api/members/me/results', None),
        ('detail', 'GET', f"/api/results/{member['result_id']}", None),
        ('submit', 'POST', '/api/results', member['payload']),
    ]:
        api(prefix + label, method, path, 401 if expired else 404, token=token,
            body=body, code='ACCESS_TOKEN_EXPIRED' if expired else 'MEMBER_NOT_FOUND')
    api(prefix + 'reissue', 'POST', '/api/auth/reissue', 401,
        body={'refreshToken': member['tokens']['refreshToken']}, code='INVALID_REFRESH_TOKEN')
    api(prefix + 'login', 'POST', '/api/auth/login', 403,
        body={'email': member['email'], 'password': PASSWORD}, code='MEMBER_WITHDRAWN')


command = sys.argv[1]
if command == 'prepare':
    assert not STATE.exists(), 'State exists; use a new test state'
    state = {}
    for role in ('api', 'browser'):
        email = f'i08-{role}-20261006@example.test'
        member = api(role + '_signup', 'POST', '/api/members', 201,
                     body=dict(email=email, password=PASSWORD, name='I08' + role,
                               gender='MALE', birthYear=1960))
        member['email'] = email
        login(member, role + '_login')
        token = member['tokens']['accessToken']
        api(role + '_active_profile', 'GET', '/api/members/me', 200, token=token)
        questions = api(role + '_questions', 'GET', '/api/surveys/1/questions', 200, token=token)
        member['payload'] = {'surveyId': 1, 'answers': [dict(questionId=q['id'], score=0) for q in questions]}
        result = api(role + '_submit', 'POST', '/api/results', 201, token=token, body=member['payload'])
        member['result_id'] = result['id']
        api(role + '_active_detail', 'GET', f"/api/results/{result['id']}", 200, token=token)
        api(role + '_active_history', 'GET', '/api/members/me/results', 200, token=token)
        state[role] = member
    STATE.write_text(json.dumps(state), encoding='utf-8')
    print('Prepared separate API and browser members', {k: v['id'] for k,v in state.items()})
else:
    state = json.loads(STATE.read_text(encoding='utf-8'))
    if command in ('deactivate', 'reactivate'):
        session = admin()
        for member in state.values():
            change_status(session, member, 'withdraw' if command == 'deactivate' else 'activate')
        if command == 'deactivate':
            probe(state['api'])
    elif command == 'short-login':
        login(state['api'], 'short_lifetime_login')
        STATE.write_text(json.dumps(state), encoding='utf-8')
    elif command == 'expired':
        probe(state['api'], expired=True)
    else:
        raise ValueError('Unknown command')
