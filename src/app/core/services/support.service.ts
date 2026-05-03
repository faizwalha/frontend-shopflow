import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SupportRequest {
  subject: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private apiUrl = '/api/support';

  submitRequest(request: SupportRequest): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }
}
