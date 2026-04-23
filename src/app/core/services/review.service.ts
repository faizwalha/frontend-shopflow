import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Review, PostReviewRequest, ReviewResponse, ReviewListResponse, ApproveReviewRequest } from '../models/review.models';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = '/api/reviews';

  postReview(request: PostReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.apiUrl, request);
  }

  getProductReviews(productId: number, page = 0, size = 10): Observable<ReviewListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ReviewListResponse>(`${this.apiUrl}/product/${productId}`, { params });
  }

  approveReview(id: number, approved: boolean): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.apiUrl}/${id}/approve`, { approved });
  }
}
