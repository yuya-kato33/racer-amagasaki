import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Racer } from '../../services/racer.service';
import { SeriesService } from '../../services/series.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-racer-series-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './racer-series-list.html',
  styleUrls: ['./racer-series-list.css']
})
export class RacerSeriesList implements OnInit, OnChanges {
  @Input() startDate = '';
  @Input() jcd = '';

  // グリッドページング
  racers: Racer[] = [];
  pages: Racer[][] = [];
  currentPage = 0;
  pageSize = 30;
  cols = 6;
  rows = 5;
  requestedPage = 0;

  isLoading = false;
  error: string | null = null;

  constructor(private seriesService: SeriesService, private route: ActivatedRoute) { }

  // URL処理
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const p = Number(params['page']);
      if (!isNaN(p)) {
        this.requestedPage = p;
      }
    })
  }

  // データ取得
  ngOnChanges(): void {
    if (this.startDate && this.jcd) {
      this.fetchRacersBySeries();
    };
  }

  // ページング関連関数
  get pagedRacers(): Racer[] {
    return this.pages[this.currentPage] ?? [];
  }

  get totalPages(): number {
    return this.pages.length;
  }

  // ページ切り替え関数
  setPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.pages.length) return;
    this.currentPage = pageIndex;
  }

  nextPage(): void {
    if (this.pages.length <= 1) return;
    this.currentPage = (this.currentPage + 1) % this.pages.length;
  }

  fetchRacersBySeries() {
    this.isLoading = true;
    this.error = null;
    this.seriesService.getRacersBySeries(this.startDate, this.jcd).subscribe({
      next: (data) => {
        console.log('節ごとの選手データ', data);
        this.racers = data;

        // this.currentPage = 0;

        this.pages = [];
        for (let i = 0; i < data.length; i += this.pageSize) {
          this.pages.push(data.slice(i, i + this.pageSize));
        }

        // ここが鳥獣用
        if (this.pages.length > 0) {
          this.currentPage = Math.min(this.requestedPage, this.pages.length - 1);
        }
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