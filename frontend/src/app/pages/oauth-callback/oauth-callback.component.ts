import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<p style="padding:2rem;font-family:sans-serif;text-align:center">Autenticando com Google...</p>`,
})
export class OAuthCallbackComponent implements OnInit {
  ngOnInit(): void {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const idToken = params.get('id_token');
    const error   = params.get('error');

    if (!window.opener) return;

    window.opener.postMessage(
      idToken
        ? { type: 'google-auth-success', id_token: idToken }
        : { type: 'google-auth-error',   error: error ?? 'unknown' },
      window.location.origin
    );
    window.close();
  }
}
