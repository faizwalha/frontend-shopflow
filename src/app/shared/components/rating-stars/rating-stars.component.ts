import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-stars.component.html'
})
export class RatingStarsComponent implements OnChanges {
  @Input() rating: number = 0;
  stars: { filled: boolean, half: boolean }[] = [];

  ngOnChanges(): void {
    this.calculateStars();
  }

  private calculateStars() {
    this.stars = [];
    for (let i = 1; i <= 5; i++) {
        this.stars.push({
            filled: i <= this.rating,
            half: this.rating > i - 1 && this.rating < i
        });
    }
  }
}
