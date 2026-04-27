import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './selector-panel.html',
  styleUrls: ['./selector-panel.css']
})

export class SelectorPanel implements OnInit {
  dates: string[] = [];
  seriesList: SeriesSummary[] = [];
  selectedDate: string = '';
  selectedSeriesKey: string = '';
  selectedSeriesLacel: string = '';

  @Output() selectionChanged = new EventEmitter<{ date: string, jcd: string }>();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<string[]>('/api/series/dates').subscribe(data => {
      this.dates = data;
    });
  }

  onDateChange(): void {
    if (!this.selectedDate) return;

    this.http.get<SeriesSummary[]>(`/api/series/bydate/${this.selectedDate}`).subscribe(data => {
      this.seriesList = data;
      this.selectedSeriesKey = '';
    });
  }

  onSeriesChange(): void {
    const [startDate, jcd] = this.selectedSeriesKey.split('_');

    if (startDate && jcd) {
      this.selectionChanged.emit({
        date: this.selectedDate,
        jcd
      });
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
  generateDates(series: SeriesSummary, todayStr: string) {

    const start = new Date(series.start_date);
    const end = new Date(series.end_date);
    const today = new Date(todayStr);

    const week = ['月', '火', '水', '木', '金', '土', '日'];

    const list = [];
    let d = new Date(start);

    while (d <= end) {
      const day = d.getDay();
      const datestr = d.toISOString().slice(0, 10);

      let cls = 'weekday';
      if (day === 5) cls = 'sat';
      if (day === 6) cls = 'sun';

      // 終了日判定
      if (d < today) {
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

