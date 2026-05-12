import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RacerList } from '../racer-list/racer-list';
import { RacerSeriesList } from '../racer-series-list/racer-series-list';
import { ActivatedRoute } from '@angular/router';

interface SeriesSummary {
  start_date: string;
  jcd: string;
  jname: string;
  grade: string;
  title: string;
  end_date: string;
}

@Component({
  selector: 'app-selector-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RacerList, RacerSeriesList],
  templateUrl: './selector-panel.html',
  styleUrls: ['./selector-panel.css']
})

export class SelectorPanel implements OnInit {
  dates: string[] = [];
  seriesList: SeriesSummary[] = [];
  selectedDate: string = '';
  selectedSeriesKey: string = '';
  selectedSeriesLabel: string = '';
  selectedJcd: string = '';
  useSeries = true;

  // クエリ保持用関数追加
  queryStartDate = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {

      this.queryStartDate = params['startDate'] || '';
      this.selectedJcd = params['jcd'] || '';

      // URLにjcdが無い場合
      // signage-stateから取得
      const stateRequest = this.selectedJcd
        ? Promise.resolve(null) : this.http.get<any>('/api/signage-state').toPromise();

      Promise.resolve(stateRequest).then(state => {

        // state優先適用
        if (!this.selectedJcd && state?.jcd) {
          this.selectedJcd = String(state.jcd).padStart(2, '0');

          console.log('signage-state jcd=', this.selectedJcd);
        }

        this.http.get<string[]>('/api/series/dates').subscribe(data => {
          // 数値として降順ソート (日付降順)
          this.dates = data.sort((a, b) => Number(b) - Number(a));

          if (this.dates.length > 0) {
            // URL startDate 優先
            if (this.queryStartDate && this.dates.includes(this.queryStartDate)
            ) {
              this.selectedDate = this.queryStartDate;
            } else {
              this.selectedDate = this.dates[0];
            }

            this.onDateChange();
          }
        });
      });
    });
  }

  onDateChange(): void {
    if (!this.selectedDate) return;

    this.http.get<SeriesSummary[]>(`/api/series/bydate/${this.selectedDate}`).subscribe(data => {
      this.seriesList = data;

      if (this.seriesList.length > 0) {

        const normalizeSelectedJcd =
          String(this.selectedJcd || '').padStart(2, '0');

        console.log('selectedJcd=', normalizeSelectedJcd);

        console.log('seriesList=', this.seriesList.map(x => x.jcd)
        );

        const matched = this.seriesList.find(s =>
          String(s.jcd).padStart(2, '0') === normalizeSelectedJcd
        );

        console.log('matched=', matched);

        const selected = matched || this.seriesList[0];

        // 自動選択
        this.selectedSeriesKey = this.getSeriesKey(selected);

        // 次処理
        this.onSeriesChange();
      }
    });

  }

  onSeriesChange(): void {
    const [startDate, jcd] = this.selectedSeriesKey.split('_');

    const selected = this.seriesList.find(
      s => s.start_date === startDate && s.jcd === jcd
    );

    if (selected) {
      // タイトルセット
      this.selectedSeriesLabel = this.formatSeriesLabel(selected);

      // 日付生成 (今日を指定)
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      this.generateDates(selected, today);

      this.selectedJcd = jcd;
    }
  }

  formatSeriesLabel(s: SeriesSummary): string {
    const start = this.formatShortDate(s.start_date);
    const end = this.formatShortDate(s.end_date);
    return `${s.jcd}# ${s.jname} ${s.grade} ${s.title} (${start}～${end})`;
  }

  private formatShortDate(datestr: string): string {
    const m = datestr.substring(4, 6);
    const d = datestr.substring(6, 8);
    return `${+m}/${+d}`; // 先頭０削除
  }

  getSeriesKey(s: SeriesSummary): string {
    return `${s.start_date}_${s.jcd}`;
  }

  dateList: {
    label: string;
    topLabel: string;
    class: string;
  }[] = [];

  // 日付生成＋状態付与
  generateDates(series: SeriesSummary, today: Date) {

    const parse = (s: string) =>
      new Date(
        Number(s.substring(0, 4)),
        Number(s.substring(4, 6)) - 1,
        Number(s.substring(6, 8))
      );

    const start = parse(series.start_date);
    const end = parse(series.end_date);

    const week = ['日', '月', '火', '水', '木', '金', '土'];

    const list = [];
    let d = new Date(start);

    while (d <= end) {
      const day = d.getDay();
      const datestr = d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');

      let cls = 'weekday';
      if (day === 0) cls = 'sun';
      if (day === 6) cls = 'sat';

      const current = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );

      // 終了日判定
      if (current < today) {
        cls += ' done';
      }

      // 上段ラベル
      let topLabel = '';
      if (datestr === series.end_date) {
        topLabel = '優勝戦';
      }

      list.push({
        label: `${d.getDate()}(${week[day]})`,
        topLabel,
        class: cls
      });

      d.setDate(d.getDate() + 1);
    }

    this.dateList = list;
  }
}

