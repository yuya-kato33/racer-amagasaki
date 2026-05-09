import { Routes } from '@angular/router';
import { App } from './app'; // ← Appコンポーネント（トップ）
import { SelectorPanel } from './components/selector-panel/selector-panel';
import { SelectorPanel2 } from './components/selector-panel2/selector-panel2';
import { TateraceSignagePage } from './components/taterace-signage-page/taterace-signage-page';
import { TateraceSignageRace } from './components/taterace-signage-race/taterace-signage-race';

export const routes: Routes = [
    { path: '', component: SelectorPanel }, // // / ルートで App を表示

    { path: 'auto', component: SelectorPanel },
    { path: 'manual', component: SelectorPanel2 },
    { path: 'racer', component: TateraceSignagePage },
    { path: 'race-signage', component: TateraceSignageRace }
];
