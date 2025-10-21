import { Component,EventEmitter,OnInit,Output } from '@angular/core';
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

  @Output() selectionChanged = new EventEmitter<{ date:string, jcd: string }>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<string[]>('/api/series/dates').subscribe(data => {
      this.dates = data;
    });
  }

  onDateChange(): void {
    if(!this.selectedDate) return;

    this.http.get<SeriesSummary[]>(`/api/series/bydate/${this.selectedDate}`).subscribe(data => {
      this.seriesList = data;
      this.selectedSeriesKey = '';
    });
  }

  onSeriesChange(): void {
    const [startDate,jcd] = this.selectedSeriesKey.split('_')
    if(startDate && jcd) {
      this.selectionChanged.emit({
        date: this.selectedDate,
        jcd});
    }
  }

  formatSeriesLabel(s: SeriesSummary): string {
    const start = this.formatShortDate(s.start_date);
    const end = this.formatShortDate(s.end_date);
    return `${s.jcd}# ${s.jname} ${s.grade} ${s.title} (${start}～${end})`;
  }

  private formatShortDate(datestr: string):string {
    const m = datestr.substring(4,6);
    const d = datestr.substring(6,8);
    return `${+m}/${+d}`; // 先頭０削除
  }

  getSeriesKey(s: SeriesSummary): string {
    return `${s.start_date}_${s.jcd}`;
  }
}
