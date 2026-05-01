import { Routes } from '@angular/router';
import { App } from './app'; // ← Appコンポーネント（トップ）
import { SelectorPanel } from './components/selector-panel/selector-panel';
import { SelectorPanel2 } from './components/selector-panel2/selector-panel2';
import { TateraceSignagePage } from './components/taterace-signage-page/taterace-signage-page';

export const routes: Routes = [
    { path: '', component: SelectorPanel }, // // / ルートで App を表示
    { path: 'manual', component: SelectorPanel2 },
    { path: 'racer', component: TateraceSignagePage }
];
