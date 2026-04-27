import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Racer } from '../../services/racer.service';
import { SeriesService } from '../../services/series.service';

@Component({
  selector: 'app-racer-series-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './racer-series-list.html',
  styleUrls: ['./racer-series-list.css']
})
export class RacerSeriesList implements OnChanges {
  @Input() startDate = '';
  @Input() jcd = '';

  racers: Racer[] = [];
  isLoading = false;
  error: string | null = null;

  cols = 6;

  constructor(private seriesService: SeriesService) { }

  ngOnChanges(): void {
    if (this.startDate && this.jcd) {
      this.fetchRacersBySeries();
    };
  }

  fetchRacersBySeries() {
    this.isLoading = true;
    this.error = null;
    this.seriesService.getRacersBySeries(this.startDate, this.jcd).subscribe({
      next: (data) => {
        console.log('節ごとの選手データ', data);
        this.racers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('選手取得エラー:', err);
        this.error = '節間選手データの取得に失敗しました';
        this.isLoading = false;
      }
    });
  }

  getPhotoPath(toban: string): string {
    return `/assets/racerphoto/${toban}.jpg`;
  }

  setFallbackImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    // placeholder.png の再読み込み防止
    if (!img.src.includes('placeholder.png')) {
      img.src = '/assets/placeholder.png';
    }
  }

  // 支部から全角スペースを削除する
  normalizeShibu(shibu: string): string {
    return shibu.replace(/\s+/g, '').replace(/　/g, ''); // 半角・全角空白を削除
  }
}