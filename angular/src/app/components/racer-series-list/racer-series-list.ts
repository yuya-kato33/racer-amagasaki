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
  @Input() page = 1;

  // グリッドページング
  racers: Racer[] = [];
  pages: Racer[][] = [];
  currentPage = 0;
  pageSize = 36;
  cols = 6;
  rows = 6;
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
    // 初回データ取得
    if (this.startDate && this.jcd && this.racers.length === 0) {
      this.fetchRacersBySeries();
    }
    // page変更時
    if (this.pages.length > 0) {
      // page1 →index = 0
      // page2 →index = 1
      this.currentPage = Math.max(0, this.page - 1);
    }
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

        // this.applyPaging();

        // this.currentPage = 0;

        // 人数条件分岐
        this.pages = [];

        const total = data.length;

        // 48人以内
        if (total <= 42) {
          const firstPageSize = 24;

          // 1ページ目 (24人)
          this.pages.push(data.slice(0, firstPageSize));

          // 2ページ目（残り)
          if (total > firstPageSize) {
            this.pages.push(data.slice(firstPageSize));
          }

          // } else if (total <= 60) {
          //   const firstPageSize = 30;

          //   // 1ページ目 (30人)
          //   this.pages.push(data.slice(0, firstPageSize));

          //   // 2ページ目（残り)
          //   if (total > firstPageSize) {
          //     this.pages.push(data.slice(firstPageSize));
          //   }
        } else {
          // 従来通り (30人ずつ)
          for (let i = 0; i < data.length; i += this.pageSize) {
            this.pages.push(data.slice(i, i + this.pageSize));
          }
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

  // // ページ送りメソッド
  // applyPaging(): void {
  //   const start = (this.page - 1) * this.pageSize;
  //   const end = start + this.pageSize;
  //   this.pagedRacers = this.racers.slice(start, end);
  // }


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