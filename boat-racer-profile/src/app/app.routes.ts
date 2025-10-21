import { Routes } from '@angular/router';
import { App } from './app'; // ← Appコンポーネント（トップ）

export const routes: Routes = [
    {path: '', component: App }, // // / ルートで App を表示
];
