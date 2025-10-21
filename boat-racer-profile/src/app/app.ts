import { Component } from '@angular/core';
import { SelectorPanel } from './components/selector-panel/selector-panel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RacerList } from './components/racer-list/racer-list';
import { RacerSeriesList } from './components/racer-series-list/racer-series-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    SelectorPanel,
    RacerList,
    RacerSeriesList
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] 
})

export class App {
  selectedDate: string = '';
  selectedJcd: string = '';
  useSeries: boolean = true; // デフォルトはシリーズ表示

  onSelectionChanged(selection: { date: string, jcd: string}) {
    this.selectedDate = selection.date;
    this.selectedJcd = selection.jcd;
  }
}
