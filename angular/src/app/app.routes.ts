import { Routes } from '@angular/router';
import { App } from './app'; // ← Appコンポーネント（トップ）
import { SelectorPanel } from './components/selector-panel/selector-panel';
import { SelectorPanel2 } from './components/selector-panel2/selector-panel2';
import { TateraceSignagePage } from './components/taterace-signage-page/taterace-signage-page';
import { TateraceSignageRace } from './components/taterace-signage-race/taterace-signage-race';
import { PlayYoutube } from './components/play-youtube/play-youtube';
import { PlayRacer } from './components/play-racer/play-racer';

export const routes: Routes = [
    { path: '', component: PlayRacer }, // // / ルートで App を表示

    { path: 'auto', component: SelectorPanel },
    { path: 'manual', component: SelectorPanel2 },
    { path: 'racer1', component: TateraceSignagePage },
    { path: 'race-signage', component: TateraceSignageRace },
    { path: 'youtube', component: PlayYoutube },
    { path: 'racer', component: PlayRacer }
];
